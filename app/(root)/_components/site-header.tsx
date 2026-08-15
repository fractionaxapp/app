"use client";

import Link from "next/link";
import { useState } from "react";

import { TrackedLink } from "@/app/_components/tracked-link";

import { Wordmark } from "./logo";
import { Arrow } from "./ui";

const navigation = [
	{ href: "/#why-now", label: "Why now" },
	{ href: "/#problem", label: "The problem" },
	{ href: "/#workflow", label: "Workflow" },
	{ href: "/#platform", label: "Platform" },
];

export function SiteHeader() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
			{/* items-stretch, so every nav cell is a full-height division of the
			    bar rather than a link floating inside it. */}
			<div className="flex h-14 items-stretch justify-between">
				<Link
					href="/"
					aria-label="Fractionax home"
					onClick={() => setIsOpen(false)}
					className="fx-bleed flex items-center"
				>
					<Wordmark />
				</Link>

				<div className="flex items-stretch">
					<nav className="hidden items-stretch md:flex">
						{navigation.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="fx-eyebrow flex items-center border-l border-border px-4 text-[10px] text-muted transition-colors hover:bg-surface hover:text-foreground"
							>
								{item.label}
							</Link>
						))}
					</nav>

					<TrackedLink
						href="/dashboard"
						event="cta_click"
						eventParams={{ location: "header" }}
						className="fx-eyebrow hidden min-w-44 items-center justify-between gap-4 bg-accent px-5 font-semibold text-accent-foreground transition-opacity hover:opacity-85 sm:flex"
					>
						Request access
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
			</div>

			{isOpen ? (
				<nav id="site-nav-mobile" className="border-t border-border md:hidden">
					{navigation.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setIsOpen(false)}
							className="fx-bleed fx-eyebrow flex items-center border-b border-border py-4 text-muted"
						>
							{item.label}
						</Link>
					))}

					<TrackedLink
						href="/dashboard"
						event="cta_click"
						eventParams={{ location: "header_mobile" }}
						onClick={() => setIsOpen(false)}
						className="fx-eyebrow flex min-h-13 items-center justify-between gap-4 bg-accent px-5 font-semibold text-accent-foreground"
					>
						Request access
						<Arrow className="size-3" />
					</TrackedLink>
				</nav>
			) : null}
		</header>
	);
}
