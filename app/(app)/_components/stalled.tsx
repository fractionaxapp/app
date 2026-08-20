"use client";

import { useEffect, useState } from "react";

import { Panel } from "./panel";

/*
 * A loading state that admits when it has stopped being one.
 *
 * A skeleton is a promise that something is coming. When the thing never
 * comes — the server stopped, the database connection died mid-render, a
 * request went out and nothing came back — the skeleton keeps making that
 * promise, animating cheerfully, forever. There is nothing in the browser that
 * can tell the difference between slow and never, so an unbounded skeleton is
 * the one state a person cannot act on: they cannot reload, because it still
 * looks like it is working.
 *
 * So every skeleton here carries a deadline. Past it, it says what it knows,
 * which is little, and offers the one move that helps.
 */

/** True once `ms` has passed since mount. */
function useStalled(ms: number) {
	const [stalled, setStalled] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setStalled(true), ms);
		return () => clearTimeout(timer);
	}, [ms]);

	return stalled;
}

function Reload({ label }: { label: string }) {
	return (
		<button
			type="button"
			onClick={() => window.location.reload()}
			className="fx-eyebrow inline-flex min-h-11 cursor-pointer items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary"
		>
			{label}
		</button>
	);
}

/*
 * Sits inside the route skeleton. Renders nothing at all until the wait stops
 * being reasonable, so an ordinarily slow page — this one talks to a database
 * several thousand miles away — is never accused of being broken.
 */
export function StillLoading({ after = 15_000 }: { after?: number }) {
	const stalled = useStalled(after);

	if (!stalled) return null;

	return (
		<div className="mx-auto mt-6 w-full max-w-2xl">
			<Panel
				title="Still loading"
				status={<span className="text-accent">No response</span>}
			>
				<div className="flex flex-col gap-5 px-5 py-6">
					<p className="text-pretty text-muted">
						This page is still waiting on the server. Past this point it is
						usually not slowness: the server has stopped, or it lost its
						connection to the database part-way through answering. Either way no
						answer is coming, and the browser has no way to know that.
					</p>

					<div>
						<Reload label="Reload the page" />
					</div>

					<p className="font-mono text-xs tracking-wide text-muted">
						Nothing you have entered is submitted from this screen, so reloading
						cannot lose work.
					</p>
				</div>
			</Panel>
		</div>
	);
}

/*
 * The same idea one layer out, where the wallet SDK restores a session. It
 * fails differently — a blocked frame, a browser extension, no network — so it
 * says so differently.
 */
export function SignInStalled() {
	return (
		<div className="mx-auto mt-6 w-full max-w-2xl">
			<Panel
				title="Sign in"
				status={<span className="text-accent">No response</span>}
			>
				<div className="flex flex-col gap-5 px-5 py-6">
					<p className="text-pretty text-muted">
						Restoring your session is taking longer than it should. This is
						nearly always something between this browser and the sign-in
						service: an extension blocking its frame, third-party storage turned
						off for this site, or a network that dropped.
					</p>

					<div>
						<Reload label="Try again" />
					</div>

					<p className="font-mono text-xs tracking-wide text-muted">
						You are not signed out. Nothing has been lost.
					</p>
				</div>
			</Panel>
		</div>
	);
}

export { useStalled };
