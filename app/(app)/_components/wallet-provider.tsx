"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { buildPrivyConfig, isWalletEnabled, PRIVY_APP_ID, PRIVY_CLIENT_ID } from "@/lib/wallet/config";

/*
 * Client boundary for the wallet SDK. PrivyProvider is a third-party React
 * context and cannot be rendered from a Server Component, so the (app) layout
 * renders this instead.
 *
 * Deliberately mounted here rather than in the root layout: the SDK is ~8 MB
 * of client JS, and the marketing surface under (root) never needs it. Keeping
 * it inside (app) leaves the landing page at its original weight. The header
 * CTA is a plain link to /dashboard, where login happens.
 *
 * When auth is not configured this returns children untouched — no provider,
 * no SDK — mirroring how Analytics renders null.
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
	/*
	 * Privy's modal takes a fixed theme while the site follows the OS setting.
	 * Start light to match the server-rendered default, then correct after
	 * mount. The modal only opens on user interaction, well after hydration,
	 * so it never renders with the wrong theme.
	 */
	const [theme, setTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const query = window.matchMedia("(prefers-color-scheme: dark)");
		const sync = () => setTheme(query.matches ? "dark" : "light");

		sync();
		query.addEventListener("change", sync);

		return () => query.removeEventListener("change", sync);
	}, []);

	const config = useMemo(() => buildPrivyConfig(theme), [theme]);

	if (!isWalletEnabled || !PRIVY_APP_ID) return <>{children}</>;

	return (
		<PrivyProvider
			appId={PRIVY_APP_ID}
			clientId={PRIVY_CLIENT_ID}
			config={config}
		>
			{children}
		</PrivyProvider>
	);
}
