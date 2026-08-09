"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { navigation } from "./navigation";

export function AppNav() {
	const pathname = usePathname();

	return (
		<nav className="flex flex-col gap-1">
			{navigation.map((item) => {
				const isActive = pathname === item.href;

				return (
					<Link
						key={item.href}
						href={item.href}
						aria-current={isActive ? "page" : undefined}
						className={`rounded-md px-3 py-2 font-medium transition-colors ${
							isActive
								? "bg-surface-muted text-foreground"
								: "text-muted hover:bg-surface-muted hover:text-foreground"
						}`}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
