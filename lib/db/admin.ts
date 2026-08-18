import "server-only";

import { query, transaction } from "./client";
import type { AccessStatus, AppUser } from "./users";

/*
 * Queries behind the access queue screen. Separate from lib/db/users because
 * these read across every account rather than the one making the request, and
 * that difference should be visible in the import.
 */

export type Account = {
	id: string;
	privy_did: string;
	email: string | null;
	oauth_provider: string | null;
	access_status: AccessStatus;
	created_at: Date;
	approved_at: Date | null;
	last_login_at: Date | null;
	wallet_count: number;
	/** Who last moved this account, from the audit log. Null if never moved. */
	decided_by: string | null;
	decided_at: Date | null;
};

export type StatusCounts = Record<AccessStatus, number> & { total: number };

const SELECT_ACCOUNTS = `
	SELECT
		u.id,
		u.privy_did,
		u.email,
		u.oauth_provider,
		u.access_status,
		u.created_at,
		u.approved_at,
		u.last_login_at,
		(SELECT count(*) FROM user_wallets w WHERE w.user_id = u.id) AS wallet_count,
		c.actor_email AS decided_by,
		c.changed_at  AS decided_at
	FROM users u
	LEFT JOIN LATERAL (
		SELECT actor_email, changed_at
		FROM access_changes
		WHERE user_id = u.id
		ORDER BY changed_at DESC
		LIMIT 1
	) c ON true
	WHERE ($1::text IS NULL OR u.access_status = $1)
		AND (
			$2::text = ''
			OR lower(u.email) LIKE '%' || lower($2) || '%'
			OR lower(u.privy_did) = lower($2)
		)
	ORDER BY
		-- Longest wait first while triaging the queue; most recent decision
		-- first when reviewing what has already been decided.
		CASE WHEN u.access_status = 'waitlisted' THEN u.created_at END ASC,
		u.created_at DESC
	LIMIT $3
`;

/**
 * The queue, filtered. `status` null means every account.
 *
 * The limit is real rather than cosmetic: this screen is for working through a
 * queue by hand, and a page that silently renders ten thousand rows is a page
 * nobody can use. The caller is told when it truncated.
 */
export async function listAccounts({
	status = null,
	search = "",
	limit = 200,
}: {
	status?: AccessStatus | null;
	search?: string;
	limit?: number;
} = {}) {
	const rows = await query<Account & { wallet_count: string }>(
		SELECT_ACCOUNTS,
		[status, search.trim(), limit],
	);

	return rows.map((row) => ({
		...row,
		// count() arrives as a bigint string from pg.
		wallet_count: Number(row.wallet_count),
	}));
}

export async function countByStatus(): Promise<StatusCounts> {
	const rows = await query<{ access_status: AccessStatus; n: string }>(
		"SELECT access_status, count(*)::text AS n FROM users GROUP BY access_status",
	);

	const counts: StatusCounts = {
		waitlisted: 0,
		approved: 0,
		declined: 0,
		total: 0,
	};

	for (const row of rows) {
		counts[row.access_status] = Number(row.n);
		counts.total += Number(row.n);
	}

	return counts;
}

export type ChangeResult =
	| { ok: true; email: string | null; from: AccessStatus; to: AccessStatus }
	| { ok: false; reason: "not-found" | "unchanged" };

/**
 * Move one account, recording who moved it.
 *
 * `approved_at` tracks the *current* grant rather than the first one, so
 * revoking clears it. The history lives in access_changes, which is the right
 * place for it — a single column cannot answer "was this ever revoked".
 */
export async function setAccessStatus(
	userId: string,
	next: AccessStatus,
	actor: { did: string; email: string | null },
): Promise<ChangeResult> {
	return transaction(async (client) => {
		// Locked because two administrators working the same queue would
		// otherwise race, and the loser's audit row would record a transition
		// that never happened.
		const { rows } = await client.query<AppUser>(
			"SELECT id, email, access_status FROM users WHERE id = $1 FOR UPDATE",
			[userId],
		);

		const before = rows[0];
		if (!before) return { ok: false, reason: "not-found" };
		if (before.access_status === next)
			return { ok: false, reason: "unchanged" };

		await client.query(
			`UPDATE users SET
				access_status = $2,
				approved_at   = CASE WHEN $2 = 'approved' THEN now() ELSE NULL END,
				updated_at    = now()
			WHERE id = $1`,
			[userId, next],
		);

		await client.query(
			`INSERT INTO access_changes (user_id, from_status, to_status, actor_did, actor_email)
			VALUES ($1, $2, $3, $4, $5)`,
			[userId, before.access_status, next, actor.did, actor.email],
		);

		return {
			ok: true,
			email: before.email,
			from: before.access_status,
			to: next,
		};
	});
}

export type Change = {
	from_status: AccessStatus;
	to_status: AccessStatus;
	actor_email: string | null;
	actor_did: string;
	changed_at: Date;
	email: string | null;
	privy_did: string;
};

/**
 * The last decisions taken, newest first.
 *
 * This is the screen's confirmation that a click did something: an admitted
 * account leaves the queue and appears here, attributed and timestamped. A
 * toast would say the same thing and then disappear.
 */
export async function listRecentChanges(limit = 8) {
	return query<Change>(
		`SELECT c.from_status, c.to_status, c.actor_email, c.actor_did, c.changed_at,
			u.email, u.privy_did
		FROM access_changes c
		JOIN users u ON u.id = c.user_id
		ORDER BY c.changed_at DESC
		LIMIT $1`,
		[limit],
	);
}
