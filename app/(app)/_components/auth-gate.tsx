"use client";

import { useAuth } from "@/lib/wallet";

import Loading from "../loading";

/*
 * Client-side gate for the product surface. This is UX, not security — the
 * server boundary is getSessionUser() in lib/wallet/server.ts.
 *
 * /dashboard is reachable while signed out on purpose: it is where signing in
 * happens, since the wallet SDK only mounts inside this route group.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
	const { isReady, isAuthenticated, signIn } = useAuth();

	// Restoring an existing session — reuse the route's own skeleton so the
	// layout does not shift once it resolves.
	if (!isReady) {
		return (
			<div className="flex-1 p-6">
				<Loading />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
				<div className="flex flex-col gap-3">
					<h1 className="text-2xl font-semibold tracking-tight">
						Sign in to continue
					</h1>
					<p className="max-w-sm text-muted">
						Use your email, a Google account, or connect an existing wallet.
					</p>
				</div>

				<button
					type="button"
					onClick={signIn}
					className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
				>
					Sign in
				</button>
			</div>
		);
	}

	return <>{children}</>;
}
