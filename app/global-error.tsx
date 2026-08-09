"use client";

import { useEffect } from "react";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

/*
 * Last-resort boundary for errors thrown by the root layout itself. It
 * replaces the whole document when active, so it must render its own <html>
 * and <body> and pull in global styles and fonts independently.
 *
 * Client Components cannot export metadata, so the title is set with React's
 * <title> element.
 */
export default function GlobalError({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string };
	unstable_retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en" className={`${fontVariables} h-full antialiased`}>
			<body className="min-h-full flex flex-col">
				<title>Something went wrong</title>

				<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
					<div className="flex flex-col gap-3">
						<h1 className="text-3xl font-semibold tracking-tight">
							Something went wrong
						</h1>
						<p className="max-w-md text-muted">
							The application failed to load. Please try again.
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
			</body>
		</html>
	);
}
