import Link from "next/link";

import { AppNav } from "./app-nav";

export function AppSidebar() {
	return (
		<aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
			<div className="flex h-14 items-center border-b border-border px-5">
				<Link href="/" className="font-semibold tracking-tight">
					App
				</Link>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				<AppNav />
			</div>

			<div className="border-t border-border p-3">
				<Link
					href="/"
					className="block rounded-md px-3 py-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
				>
					← Back to site
				</Link>
			</div>
		</aside>
	);
}
