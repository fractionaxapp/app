import type { PrivyClientConfig } from "@privy-io/react-auth";

import { siteConfig } from "@/lib/site";

/*
 * Wallet/auth configuration. Isomorphic — safe to import from server and
 * client, so it holds only values and types, never Privy runtime code.
 */

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
export const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

/**
 * Leave NEXT_PUBLIC_PRIVY_APP_ID unset to disable auth entirely: no provider
 * mounts, no SDK loads, and the app renders as an anonymous marketing site.
 */
export const isWalletEnabled = Boolean(PRIVY_APP_ID);

export function buildPrivyConfig(theme: "light" | "dark"): PrivyClientConfig {
	return {
		loginMethods: ["email", "google", "wallet"],

		appearance: {
			theme,
			accentColor: siteConfig.colors.dark,
			/*
			 * Ethereum only, because that is all this app can actually do.
			 * Offering Solana put Solana wallets in the sign-in modal while no
			 * Solana connectors were ever passed to the SDK, so anyone choosing
			 * one would have found it did not connect. A sign-in screen offering
			 * a route that dead-ends is worse than one offering fewer routes.
			 *
			 * This does not silence the SDK's warning about it: that comes from
			 * solana_wallet_auth in the Privy dashboard, which nothing in this
			 * repository can reach. Turn it off there as well.
			 *
			 * Widen this the day the /solana entrypoint is wired up in
			 * lib/wallet, and not before.
			 */
			walletChainType: "ethereum-only",
		},

		/*
		 * Cost control: do NOT auto-create wallets on login.
		 *
		 * Wallet vendors bill per active wallet, so provisioning one for every
		 * signup means paying for people who never transact. Wallets are created
		 * on demand instead — see createWallet in lib/wallet.
		 *
		 * This setting alone does not achieve that, which is the important part.
		 * The Privy dashboard carries its own embedded_wallet_config, and where
		 * it says create_on_login: "all-users" it is the one that decides: the
		 * first account on this project was given an Ethereum wallet AND a
		 * Solana one nine days after this line was written — and nothing in this
		 * repository can create a Solana wallet at all, so they were not ours.
		 *
		 * Keep both in agreement. A commercial decision recorded only in code
		 * that the vendor overrides is not a decision, it is a comment.
		 */
		embeddedWallets: {
			ethereum: { createOnLogin: "off" },
			solana: { createOnLogin: "off" },
		},
	};
}
