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
 *
 * The shell is exactly one viewport tall and never scrolls itself. Scrolling
 * belongs to the two regions that can outgrow it — the work area and the
 * sidebar's link list — so the topbar, the wordmark and "Back to site" stay
 * where they were put. `dvh` rather than `svh` because nothing here scrolls
 * the page, so the browser chrome never retracts mid-gesture and leaves a
 * band of background under the frame.
 *
 * Every flex parent between here and a scrolling child carries min-h-0. A flex
 * item's default min-height is auto, which means it refuses to shrink below
 * its content — and a region that cannot shrink can never overflow, so
 * overflow-y-auto on it does nothing at all.
 */
export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<WalletProvider>
			<UserSync />

			<div className="ds-app flex h-dvh flex-col overflow-hidden bg-background text-foreground">
				{/* Chrome only appears once signed in; the gate renders the
				    sign-in screen in its place otherwise. */}
				<AuthGate>
					<div className="flex min-h-0 flex-1">
						<AppSidebar />

						<div className="flex min-h-0 min-w-0 flex-1 flex-col">
							<AppTopbar />
							<main className="min-h-0 flex-1 overflow-y-auto p-6">
								{children}
							</main>
						</div>
					</div>
				</AuthGate>
			</div>
		</WalletProvider>
	);
}
