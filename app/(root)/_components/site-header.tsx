"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/app/_components/logo";
import { TrackedLink } from "@/app/_components/tracked-link";

import { stages } from "./stages";
import { Arrow } from "./ui";

/*
 * The nav is the workflow: one item per stage, each its own page.
 *
 * It used to track sections on the home page with a scroll listener. Now that
 * every item is a route, the current item is just the current path — which is
 * both simpler and correct on a page reached directly from search.
 */
export function SiteHeader() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
			{/* items-stretch, so every nav cell is a full-height division of the
			    bar rather than a link floating inside it. */}
			<div className="relative flex h-14 items-stretch justify-between">
				<Link
					href="/"
					aria-label="Fractionax home"
					onClick={() => setIsOpen(false)}
					className="fx-bleed flex items-center md:border-r md:border-border"
				>
					<Wordmark />
				</Link>

				<div className="flex items-stretch">
					<nav className="hidden items-stretch md:flex">
						{stages.map((stage) => {
							const href = `/${stage.slug}`;
							const isActive = pathname === href;

							return (
								<Link
									key={stage.slug}
									href={href}
									aria-current={isActive ? "page" : undefined}
									className={`fx-eyebrow flex items-center gap-2.5 border-l border-border px-4 text-[10px] transition-colors ${
										isActive
											? "bg-surface text-foreground"
											: "text-muted hover:bg-surface hover:text-foreground"
									}`}
								>
									<span
										aria-hidden
										className={`size-1 transition-colors ${
											isActive ? "bg-primary" : "bg-transparent"
										}`}
									/>
									{stage.label}
								</Link>
							);
						})}
					</nav>

					<TrackedLink
						href="/dashboard"
						event="cta_click"
						eventParams={{ location: "header" }}
						className="fx-eyebrow hidden min-w-44 items-center justify-between gap-4 bg-primary px-5 font-semibold text-primary-foreground transition-opacity hover:opacity-85 sm:flex"
					>
						Join the beta
						<Arrow className="size-3" />
					</TrackedLink>

					<button
						type="button"
						onClick={() => setIsOpen((open) => !open)}
						aria-expanded={isOpen}
						aria-controls="site-nav-mobile"
						aria-label={isOpen ? "Close menu" : "Open menu"}
						className="flex w-14 items-center justify-center border-l border-border text-foreground md:hidden"
					>
						<span className="relative block h-3 w-4.5">
							<span
								className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-200 ${
									isOpen ? "translate-y-1.5 rotate-45" : ""
								}`}
							/>
							<span
								className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-200 ${
									isOpen ? "-translate-y-1.5 -rotate-45" : ""
								}`}
							/>
						</span>
					</button>
				</div>

				{/* How far down the page you are. Pure CSS — see globals. */}
				<span
					aria-hidden
					className="fx-progress absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary"
				/>
			</div>

			{isOpen ? (
				<nav id="site-nav-mobile" className="border-t border-border md:hidden">
					{stages.map((stage, index) => {
						const href = `/${stage.slug}`;

						return (
							<Link
								key={stage.slug}
								href={href}
								onClick={() => setIsOpen(false)}
								className="fx-bleed flex items-baseline gap-4 border-b border-border py-4"
							>
								<span className="fx-eyebrow text-accent tabular-nums">
									{String(index + 1).padStart(2, "0")}
								</span>
								<span
									className={
										pathname === href ? "text-foreground" : "text-muted"
									}
								>
									{stage.label}
								</span>
							</Link>
						);
					})}

					<TrackedLink
						href="/dashboard"
						event="cta_click"
						eventParams={{ location: "header_mobile" }}
						onClick={() => setIsOpen(false)}
						className="fx-eyebrow flex min-h-13 items-center justify-between gap-4 bg-primary px-5 font-semibold text-primary-foreground"
					>
						Join the beta
						<Arrow className="size-3" />
					</TrackedLink>
				</nav>
			) : null}
		</header>
	);
}
