"use client";

import {
	getEmbeddedConnectedWallet,
	useCreateWallet,
	usePrivy,
	useWallets,
	type User,
} from "@privy-io/react-auth";
import { useCallback, useMemo, useState } from "react";

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
 * Wallets, and the one decision worth being careful about: when one is made.
 *
 * A wallet is not free. Vendors bill per active wallet, so provisioning one for
 * everybody who signs up means paying for people who never transact — and
 * handing an account custody of something it never asked for. So nothing here
 * runs on login. ensureWallet is called at the point an address is genuinely
 * needed, by the screen that needs it, and never anywhere else.
 *
 * Whether that holds is not decided in this file alone. The vendor dashboard
 * carries its own create-on-login setting and it wins where the two disagree —
 * see the note in ./config.
 *
 * useWallets reports the user's EVM wallets. Solana wallets come from the
 * SDK's separate /solana entrypoint — add that here when Solana ships, so the
 * rest of the app keeps consuming one list.
 */

export type WalletState = {
	/**
	 * False until the SDK has listed what this account already has. Creating a
	 * wallet before that is answered risks making a second one.
	 */
	isReady: boolean;
	wallets: AppWallet[];
	/** The wallet this product provisioned, once it exists. */
	embedded: AppWallet | null;
	isCreating: boolean;
	/** The last failure, in words worth showing someone. */
	error: string | null;
	ensureWallet: () => Promise<AppWallet | null>;
};

export function useWallet(): WalletState {
	const { wallets, ready } = useWallets();
	const { createWallet } = useCreateWallet();

	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	const embedded = useMemo(() => {
		const found = getEmbeddedConnectedWallet(wallets);

		return found
			? {
					address: found.address,
					chainType: found.type,
					isEmbedded: true,
				}
			: null;
	}, [wallets]);

	/*
	 * Call this at the moment a wallet is actually needed — the first onchain
	 * action, or an address to hand a venue — never on login.
	 *
	 * Idempotent by design: an account that already has one gets it back, since
	 * the vendor errors rather than quietly making a second.
	 */
	const ensureWallet = useCallback(async () => {
		// The list has not arrived yet, so "does one exist" has no answer worth
		// acting on. Refusing is the safe half of the ambiguity.
		if (!ready) return null;
		if (embedded) return embedded;

		setIsCreating(true);
		setError(null);

		try {
			const created = await createWallet();

			/*
			 * Mirror it immediately. Our own records are otherwise written only at
			 * login, which would leave a wallet that exists at the vendor and not
			 * here — and this address is about to be given to a venue.
			 */
			await fetch("/api/auth/sync", { method: "POST" }).catch(() => {
				// The wallet exists either way; the mirror catches up next login.
			});

			return {
				address: created.address,
				chainType: created.chainType,
				isEmbedded: true,
			} satisfies AppWallet;
		} catch (cause) {
			/*
			 * The vendor's own words where it gave any: it knows what went wrong
			 * and this does not. What is deliberately not claimed here is that
			 * nothing was created — a failure late in the call could leave a
			 * wallet behind, and reloading shows the truth of it.
			 */
			setError(
				cause instanceof Error && cause.message
					? cause.message
					: "The wallet could not be created. Reload the page to see whether one was made before trying again.",
			);

			return null;
		} finally {
			setIsCreating(false);
		}
	}, [ready, embedded, createWallet]);

	return {
		isReady: ready,
		wallets: appWallets,
		embedded,
		isCreating,
		error,
		ensureWallet,
	};
}
