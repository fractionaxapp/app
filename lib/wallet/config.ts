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
			walletChainType: "ethereum-and-solana",
		},

		/*
		 * Cost control: do NOT auto-create wallets on login.
		 *
		 * Wallet vendors bill per active wallet, so provisioning one for every
		 * signup means paying for people who never transact. Wallets are created
		 * on demand instead — see createWallet in lib/wallet.
		 *
		 * 'off' is the SDK default in v3; it is stated explicitly here because
		 * this is a deliberate commercial decision, not an oversight.
		 */
		embeddedWallets: {
			ethereum: { createOnLogin: "off" },
			solana: { createOnLogin: "off" },
		},
	};
}
