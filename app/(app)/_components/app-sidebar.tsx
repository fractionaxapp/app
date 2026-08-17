import Link from "next/link";

import { Wordmark } from "@/app/_components/logo";

import { AppNav } from "./app-nav";

export function AppSidebar() {
	return (
		<aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
			{/* Same height as the topbar beside it, so the two rules meet. */}
			<div className="flex h-14 items-center border-b border-border px-5">
				<Link href="/" aria-label="Fractionax home">
					<Wordmark />
				</Link>
			</div>

			<div className="flex-1 overflow-y-auto py-4">
				<AppNav />
			</div>

			<Link
				href="/"
				className="fx-eyebrow group flex items-center gap-2.5 border-t border-border px-5 py-4 text-muted transition-colors hover:text-foreground"
			>
				<span
					aria-hidden
					className="size-1 shrink-0 bg-primary opacity-0 transition-opacity group-hover:opacity-100"
				/>
				Back to site
			</Link>
		</aside>
	);
}
