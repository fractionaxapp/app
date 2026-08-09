"use client";

import { usePathname } from "next/navigation";
import { titleForPathname } from "./navigation";

export function AppTopbar() {
	const pathname = usePathname();

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
			<h1 className="font-medium">{titleForPathname(pathname)}</h1>

			<div
				aria-label="Account"
				className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium"
			>
				NA
			</div>
		</header>
	);
}
