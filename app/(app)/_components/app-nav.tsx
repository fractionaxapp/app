"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { navigation, type NavGroup } from "./navigation";

/*
 * Grouped, collapsible sidebar navigation.
 *
 * Groups start open. Collapsing is remembered for as long as the layout is
 * mounted, which is every client navigation inside the product — the sidebar
 * is not re-rendered from scratch when the page under it changes.
 */

function Chevron({ open }: { open: boolean }) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 12 12"
			className={`size-3 shrink-0 transition-transform duration-150 ${
				open ? "" : "-rotate-90"
			}`}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		>
			<path d="M2.5 4.5 6 8l3.5-3.5" />
		</svg>
	);
}

/** `extra` carries groups the server decided this user may see. */
export function AppNav({ extra = [] }: { extra?: readonly NavGroup[] }) {
	const pathname = usePathname();
	const groups = [...navigation, ...extra];

	const [collapsed, setCollapsed] = useState<string[]>([]);

	const activeGroup =
		groups.find((group) => group.items.some((item) => item.href === pathname))
			?.label ?? null;

	/*
	 * Arriving in a collapsed group opens it. Otherwise the sidebar would show
	 * no trace of where you are, which is the one thing it exists to answer.
	 *
	 * Adjusted during render rather than in an effect: React re-runs this pass
	 * before touching the DOM, so the group is already open the first time the
	 * new route paints instead of opening a frame later.
	 */
	const [lastActive, setLastActive] = useState(activeGroup);

	if (activeGroup !== lastActive) {
		setLastActive(activeGroup);

		if (activeGroup) {
			setCollapsed((labels) => labels.filter((label) => label !== activeGroup));
		}
	}

	return (
		<nav className="flex flex-col">
			{groups.map((group) => {
				const isOpen = !collapsed.includes(group.label);
				const panelId = `nav-${group.label.toLowerCase()}`;

				return (
					<section key={group.label} className="mb-2 last:mb-0">
						<h2>
							<button
								type="button"
								aria-expanded={isOpen}
								aria-controls={panelId}
								onClick={() =>
									setCollapsed((labels) =>
										labels.includes(group.label)
											? labels.filter((label) => label !== group.label)
											: [...labels, group.label],
									)
								}
								className="fx-eyebrow flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-2.5 text-muted/60 transition-colors hover:text-muted"
							>
								{group.label}
								<Chevron open={isOpen} />
							</button>
						</h2>

						<div id={panelId} hidden={!isOpen} className="flex flex-col">
							{group.items.map((item) => {
								const isActive = pathname === item.href;

								return (
									<Link
										key={item.href}
										href={item.href}
										aria-current={isActive ? "page" : undefined}
										/* Same marker the marketing header uses for the current
										   section, so "where am I" reads identically on both
										   surfaces. */
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
						</div>
					</section>
				);
			})}
		</nav>
	);
}
