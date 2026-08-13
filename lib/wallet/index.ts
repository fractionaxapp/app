"use client";

import { useCreateWallet, usePrivy, useWallets, type User } from "@privy-io/react-auth";
import { useCallback, useMemo } from "react";

import { isWalletEnabled } from "./config";

/*
 * The only module in the app allowed to import from @privy-io/*.
 *
 * Everything else consumes these verbs and types, so replacing the wallet
 * vendor is a change confined to this directory plus the provider component.
 * Mirrors how lib/analytics.ts hides @next/third-parties behind trackEvent.
 */

export type AuthUser = {
	/** Stable vendor-independent identifier. Privy's DID today. */
	id: string;
	email: string | null;
	createdAt: Date;
};

export type AppWallet = {
	address: string;
	chainType: string;
	/** True when we custody the keys for the user rather than them connecting. */
	isEmbedded: boolean;
};

function toAuthUser(user: User | null): AuthUser | null {
	if (!user) return null;

	return {
		id: user.id,
		email: user.email?.address ?? null,
		createdAt: user.createdAt,
	};
}

export type AuthState = {
	/** False when no Privy app id is configured for this build. */
	isEnabled: boolean;
	/** False until the SDK has restored any existing session. */
	isReady: boolean;
	isAuthenticated: boolean;
	user: AuthUser | null;
	signIn: () => void;
	signOut: () => void;
};

export function useAuth(): AuthState {
	const { ready, authenticated, user, login, logout } = usePrivy();

	return useMemo(() => {
		/*
		 * With no app id the provider never mounts, so usePrivy falls back to
		 * its default context where `ready` stays false forever. Report a
		 * settled, signed-out state instead — otherwise anything waiting on
		 * `isReady` hangs on its loading state permanently.
		 */
		if (!isWalletEnabled) {
			return {
				isEnabled: false,
				isReady: true,
				isAuthenticated: false,
				user: null,
				signIn: () => {},
				signOut: () => {},
			};
		}

		return {
			isEnabled: true,
			isReady: ready,
			isAuthenticated: ready && authenticated,
			user: toAuthUser(user),
			signIn: login,
			signOut: logout,
		};
	}, [ready, authenticated, user, login, logout]);
}

/*
 * useWallets reports the user's EVM wallets. Solana wallets come from the
 * SDK's separate /solana entrypoint — add that here when Solana ships, so the
 * rest of the app keeps consuming one list.
 */
export function useWallet() {
	const { wallets } = useWallets();
	const { createWallet } = useCreateWallet();

	const appWallets: AppWallet[] = useMemo(
		() =>
			wallets.map((wallet) => ({
				address: wallet.address,
				// Connected wallets expose `type`; freshly created ones `chainType`.
				chainType: wallet.type,
				isEmbedded: wallet.walletClientType === "privy",
			})),
		[wallets],
	);

	/*
	 * Call this at the moment a wallet is actually needed — the first onchain
	 * action — not on login. See the cost note in lib/wallet/config.ts.
	 */
	const ensureWallet = useCallback(async () => {
		const existing = appWallets[0];
		if (existing) return existing;

		const created = await createWallet();

		return {
			address: created.address,
			chainType: created.chainType,
			isEmbedded: true,
		} satisfies AppWallet;
	}, [appWallets, createWallet]);

	return { wallets: appWallets, ensureWallet };
}
