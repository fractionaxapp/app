import type { Metadata } from "next";

import { AppSidebar } from "./_components/app-sidebar";
import { AppTopbar } from "./_components/app-topbar";
import { AuthGate } from "./_components/auth-gate";
import { UserSync } from "./_components/user-sync";
import { WalletProvider } from "./_components/wallet-provider";

/* The product surface is behind auth and has nothing to index. */
export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

/*
 * Product chrome: fixed sidebar beside a scrolling work area under a topbar.
 * Scoped to the .ds-app design system, which runs at a tighter density than
 * the marketing surface while sharing its tokens.
 */
export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<WalletProvider>
			<UserSync />

			<div className="ds-app flex min-h-full flex-1 flex-col bg-surface-muted text-foreground">
				{/* Chrome only appears once signed in; the gate renders the
				    sign-in screen in its place otherwise. */}
				<AuthGate>
					<div className="flex flex-1">
						<AppSidebar />

						<div className="flex min-w-0 flex-1 flex-col">
							<AppTopbar />
							<main className="flex-1 p-6">{children}</main>
						</div>
					</div>
				</AuthGate>
			</div>
		</WalletProvider>
	);
}
