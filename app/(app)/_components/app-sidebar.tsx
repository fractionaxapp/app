import Link from "next/link";

import { Wordmark } from "@/app/_components/logo";
import { getAdmin } from "@/lib/admin";

import { AppNav } from "./app-nav";
import { adminNavigation } from "./navigation";

/*
 * Async so the access link is decided on the server, from the verified
 * session. The client is never sent a flag it could flip — it is sent the
 * link or it is not.
 */
export async function AppSidebar() {
	const admin = await getAdmin();

	return (
		<aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
			{/* Same height as the topbar beside it, so the two rules meet. */}
			<div className="flex h-14 shrink-0 items-center border-b border-border px-5">
				<Link href="/" aria-label="Fractionax home">
					<Wordmark />
				</Link>
			</div>

			{/* The only part of the sidebar that scrolls; the wordmark above and
			    the exit below stay put however long the list gets. */}
			<div className="min-h-0 flex-1 overflow-y-auto py-4">
				<AppNav extra={admin ? adminNavigation : []} />
			</div>

			<Link
				href="/"
				className="fx-eyebrow group flex shrink-0 items-center gap-2.5 border-t border-border px-5 py-4 text-muted transition-colors hover:text-foreground"
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
