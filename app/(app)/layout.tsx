import type { Metadata } from "next";

import { AppSidebar } from "./_components/app-sidebar";
import { AppTopbar } from "./_components/app-topbar";

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
		<div className="ds-app flex min-h-full flex-1 bg-surface-muted text-foreground">
			<AppSidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<AppTopbar />
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
