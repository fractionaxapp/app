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
	const { isEnabled, isReady, isAuthenticated, signIn } = useAuth();

	/*
	 * No Privy app id configured — local development, previews, or before the
	 * account exists. Show the surface rather than an inert sign-in screen, so
	 * the dashboard stays workable without credentials.
	 */
	if (!isEnabled) return <>{children}</>;

	// Restoring an existing session — reuse the route's own skeleton so the
	// layout does not shift once it resolves.
	if (!isReady) {
		return (
			<div className="min-h-0 flex-1 overflow-y-auto p-6">
				<Loading />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-24">
				<div className="w-full max-w-md border border-border bg-surface">
					<div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
						<p className="fx-eyebrow text-muted">Fractionax</p>
						<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
							<span aria-hidden className="size-1.5 bg-primary" />
							Private beta
						</p>
					</div>

					<div className="px-5 py-8">
						<h1 className="text-[clamp(24px,3vw,34px)] leading-[1.05] font-extrabold tracking-[-0.04em] uppercase">
							Sign in to continue
						</h1>
						<p className="mt-4 text-pretty text-muted">
							Use your email, a Google account, or connect an existing wallet.
						</p>
					</div>

					<button
						type="button"
						onClick={signIn}
						className="fx-eyebrow flex min-h-13 w-full cursor-pointer items-center justify-between gap-4 border-t border-border bg-primary px-5 font-semibold text-primary-foreground transition-opacity hover:opacity-85"
					>
						Sign in
						<span aria-hidden>→</span>
					</button>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
