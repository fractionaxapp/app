"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "./navigation";

/* `extra` carries links the server decided this user may see. */
export function AppNav({
	extra = [],
}: {
	extra?: readonly { href: string; label: string }[];
}) {
	const pathname = usePathname();
	const items = [...navigation, ...extra];

	return (
		<nav className="flex flex-col">
			{items.map((item) => {
				const isActive = pathname === item.href;

				return (
					<Link
						key={item.href}
						href={item.href}
						aria-current={isActive ? "page" : undefined}
						/* Same marker the marketing header uses for the current
						   section, so "where am I" reads identically on both surfaces. */
						className={`fx-eyebrow flex items-center gap-2.5 px-5 py-3 transition-colors ${
							isActive
								? "bg-surface-muted text-foreground"
								: "text-muted hover:bg-surface-muted hover:text-foreground"
						}`}
					>
						<span
							aria-hidden
							className={`size-1 shrink-0 ${
								isActive ? "bg-primary" : "bg-transparent"
							}`}
						/>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
