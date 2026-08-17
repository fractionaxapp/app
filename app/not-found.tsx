import Link from "next/link";

import type { Metadata } from "next";

// Next emits <meta name="robots" content="noindex"> for this boundary itself.
export const metadata: Metadata = {
	title: "Page not found",
};

/*
 * Rendered for unmatched URLs and for notFound() calls that no nearer
 * not-found file handles. It sits above both route groups, so it carries no
 * marketing or dashboard chrome of its own.
 */
export default function NotFound() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
			<p className="font-mono text-sm text-muted">404</p>

			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-semibold tracking-tight">
					This page could not be found
				</h1>
				<p className="max-w-md text-muted">
					The page you are looking for may have been moved, renamed, or never
					existed.
				</p>
			</div>

			<Link
				href="/"
				className="fx-eyebrow inline-flex min-h-13 items-center justify-center gap-4 bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-85"
			>
				Back to home
			</Link>
		</div>
	);
}
