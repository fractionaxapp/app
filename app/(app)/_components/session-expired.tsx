"use client";

import { useAuth } from "@/lib/wallet";

import { Panel } from "./panel";

/*
 * Shown when the browser believes it is signed in and the server does not.
 *
 * That is not an edge case: Privy's access token is short-lived, so a tab left
 * open overnight comes back with a cookie the server will not verify while the
 * client SDK still reports an authenticated session. The chrome renders, the
 * page returns nothing, and the account is left looking at a blank screen with
 * no way to tell whether the product is broken or empty.
 *
 * Signing out is the fix rather than signing in: the stale session has to go
 * before a new one can be established, and clearing it drops the account onto
 * the ordinary sign-in screen.
 */
export function SessionExpired() {
	const { isEnabled, signOut } = useAuth();

	return (
		<div className="mx-auto w-full max-w-2xl">
			<Panel
				title="Session"
				status={<span className="text-accent">Not verified</span>}
			>
				<div className="flex flex-col gap-5 px-5 py-6">
					<p className="text-pretty text-muted">
						Your browser is holding a session this server cannot verify — which
						usually means it expired while the tab was open. Nothing is wrong
						with your account and nothing has been lost.
					</p>

					{isEnabled ? (
						<div>
							<button
								type="button"
								onClick={signOut}
								className="fx-eyebrow inline-flex min-h-11 cursor-pointer items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary"
							>
								Sign in again
							</button>
						</div>
					) : (
						<p className={"font-mono text-xs tracking-wide text-muted"}>
							Authentication is not configured on this server.
						</p>
					)}
				</div>
			</Panel>
		</div>
	);
}
