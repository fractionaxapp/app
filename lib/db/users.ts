import "server-only";

import { transaction } from "./client";

/*
 * Persistence for the mirrored Privy identities. Privy stays the source of
 * truth for authentication; these rows are our durable copy.
 */

export type AppUser = {
	id: string;
	privy_did: string;
	email: string | null;
	phone: string | null;
	oauth_provider: string | null;
	oauth_subject: string | null;
	created_at: Date;
	updated_at: Date;
	last_login_at: Date | null;
};

export type WalletSnapshot = {
	address: string;
	/** 'ethereum' | 'solana' | 'bitcoin' | ... */
	chainType: string;
	/** 'privy' for embedded wallets, otherwise the connector name. */
	walletClientType?: string | null;
	isEmbedded: boolean;
};

export type PrivyUserSnapshot = {
	/** Privy DID, e.g. did:privy:clxxxx. */
	did: string;
	email?: string | null;
	phone?: string | null;
	oauthProvider?: string | null;
	oauthSubject?: string | null;
	wallets?: WalletSnapshot[];
};

export type LoginContext = {
	/** 'email' | 'google' | 'wallet' | ... */
	method?: string | null;
	ip?: string | null;
	userAgent?: string | null;
};

const UPSERT_USER = `
	INSERT INTO users (privy_did, email, phone, oauth_provider, oauth_subject, last_login_at)
	VALUES ($1, $2, $3, $4, $5, now())
	ON CONFLICT (privy_did) DO UPDATE SET
		email          = COALESCE(EXCLUDED.email, users.email),
		phone          = COALESCE(EXCLUDED.phone, users.phone),
		oauth_provider = COALESCE(EXCLUDED.oauth_provider, users.oauth_provider),
		oauth_subject  = COALESCE(EXCLUDED.oauth_subject, users.oauth_subject),
		updated_at     = now(),
		last_login_at  = now()
	RETURNING *
`;

const UPSERT_WALLET = `
	INSERT INTO user_wallets (user_id, address, chain_type, wallet_client_type, is_embedded)
	VALUES ($1, $2, $3, $4, $5)
	ON CONFLICT (address, chain_type) DO UPDATE SET
		user_id            = EXCLUDED.user_id,
		wallet_client_type = COALESCE(EXCLUDED.wallet_client_type, user_wallets.wallet_client_type),
		is_embedded        = EXCLUDED.is_embedded
`;

const INSERT_LOGIN_EVENT = `
	INSERT INTO login_events (user_id, method, ip, user_agent)
	VALUES ($1, $2, $3, $4)
`;

/*
 * `ip` is an inet column, so a malformed value would abort the transaction and
 * cost us the whole login record. A missing IP is not worth that.
 */
function normaliseIp(value: string | null | undefined) {
	if (!value) return null;

	// x-forwarded-for is a comma-separated chain; the client is first.
	const candidate = value.split(",")[0]?.trim();
	if (!candidate) return null;

	return /^[0-9a-fA-F:.]+$/.test(candidate) ? candidate : null;
}

/**
 * Write a Privy identity into Postgres, recording the login. Called after the
 * access token has been verified server-side — never trust a snapshot that
 * arrived straight from the browser.
 */
export async function upsertUserFromPrivy(
	snapshot: PrivyUserSnapshot,
	login?: LoginContext,
): Promise<AppUser> {
	return transaction(async (client) => {
		const { rows } = await client.query<AppUser>(UPSERT_USER, [
			snapshot.did,
			snapshot.email ?? null,
			snapshot.phone ?? null,
			snapshot.oauthProvider ?? null,
			snapshot.oauthSubject ?? null,
		]);

		const user = rows[0];

		for (const wallet of snapshot.wallets ?? []) {
			await client.query(UPSERT_WALLET, [
				user.id,
				wallet.address,
				wallet.chainType,
				wallet.walletClientType ?? null,
				wallet.isEmbedded,
			]);
		}

		if (login) {
			await client.query(INSERT_LOGIN_EVENT, [
				user.id,
				login.method ?? null,
				normaliseIp(login.ip),
				login.userAgent ?? null,
			]);
		}

		return user;
	});
}

export async function findUserByPrivyDid(did: string): Promise<AppUser | null> {
	return transaction(async (client) => {
		const { rows } = await client.query<AppUser>(
			"SELECT * FROM users WHERE privy_did = $1",
			[did],
		);

		return rows[0] ?? null;
	});
}
