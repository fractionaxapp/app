import "server-only";

import { PrivyClient, type User } from "@privy-io/server-auth";

import type { PrivyUserSnapshot } from "@/lib/db/users";

/*
 * Server-side half of the wallet module. Verifies Privy sessions and maps the
 * vendor's user object into the snapshot our database understands.
 *
 * Together with lib/wallet/index.ts this is the only place @privy-io is
 * imported, so swapping vendor stays contained.
 */

/** Cookie Privy sets holding the short-lived access token (a JWT). */
export const ACCESS_TOKEN_COOKIE = "privy-token";
/**
 * Cookie holding the identity token. Carries the full user object, so reading
 * it avoids an API round trip and the rate limits that come with one. Only
 * present when identity tokens are enabled in the Privy dashboard.
 */
export const IDENTITY_TOKEN_COOKIE = "privy-id-token";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET;

export const isServerAuthConfigured = Boolean(appId && appSecret);

let cachedClient: PrivyClient | undefined;

export function getPrivyClient(): PrivyClient {
	if (!appId || !appSecret) {
		throw new Error(
			"NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET must both be set to verify sessions server-side.",
		);
	}

	cachedClient ??= new PrivyClient(appId, appSecret);
	return cachedClient;
}

/**
 * Verify an access token and return the Privy DID it belongs to, or null if
 * the token is missing, expired or forged. This is the security boundary —
 * never trust a user id sent from the browser.
 */
export async function verifySession(token: string | undefined | null) {
	if (!token || !isServerAuthConfigured) return null;

	try {
		const claims = await getPrivyClient().verifyAuthToken(token);
		return { userId: claims.userId, sessionId: claims.sessionId };
	} catch {
		// Expired or invalid; the caller treats this as signed out.
		return null;
	}
}

/**
 * Resolve the full user. Prefers the identity token because it parses locally;
 * falls back to the rate-limited API lookup when identity tokens are off.
 */
export async function resolveUser(
	userId: string,
	identityToken?: string | null,
): Promise<User | null> {
	const client = getPrivyClient();

	try {
		if (identityToken) {
			return await client.getUser({ idToken: identityToken });
		}

		return await client.getUserById(userId);
	} catch {
		return null;
	}
}

/** Flatten Privy's user object into the shape lib/db/users persists. */
export function toUserSnapshot(user: User): PrivyUserSnapshot {
	const wallets = user.linkedAccounts
		.filter((account) => account.type === "wallet")
		.map((wallet) => ({
			address: wallet.address,
			chainType: wallet.chainType,
			walletClientType: wallet.walletClientType ?? null,
			isEmbedded: wallet.walletClientType === "privy",
		}));

	return {
		did: user.id,
		email: user.email?.address ?? user.google?.email ?? null,
		phone: user.phone?.number ?? null,
		oauthProvider: user.google ? "google" : null,
		oauthSubject: user.google?.subject ?? null,
		wallets,
	};
}

/** Best-effort label for which method the user signed in with. */
export function loginMethodOf(user: User) {
	if (user.google) return "google";
	if (user.email) return "email";
	if (user.phone) return "sms";
	if (user.wallet) return "wallet";
	return null;
}
