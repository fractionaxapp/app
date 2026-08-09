"use client";

import { useEffect } from "react";

/*
 * Error boundary for everything below the root layout. Errors thrown in the
 * root layout itself escape this boundary and land in global-error.tsx.
 *
 * Error boundaries must be Client Components, so this file cannot export
 * metadata.
 */
export default function Error({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string };
	unstable_retry: () => void;
}) {
	useEffect(() => {
		// Swap for your error reporting service.
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-semibold tracking-tight">
					Something went wrong
				</h1>
				<p className="max-w-md text-muted">
					An unexpected error occurred. Trying again will re-fetch and re-render
					this section.
				</p>
				{error.digest ? (
					<p className="font-mono text-xs text-muted">
						Reference: {error.digest}
					</p>
				) : null}
			</div>

			<button
				type="button"
				onClick={() => unstable_retry()}
				className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
			>
				Try again
			</button>
		</div>
	);
}
