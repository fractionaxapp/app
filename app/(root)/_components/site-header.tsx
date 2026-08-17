"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TrackedLink } from "@/app/_components/tracked-link";

import { Wordmark } from "@/app/_components/logo";
import { Arrow } from "./ui";

const navigation = [
	{ id: "workflow", label: "How it works" },
	{ id: "control", label: "Control" },
	{ id: "platform", label: "Underneath" },
	{ id: "faq", label: "FAQ" },
];

export function SiteHeader() {
	const [isOpen, setIsOpen] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);

	/*
	 * Marks the section you are currently in. The root margin collapses the
	 * viewport to a band just under the header, so "current" means the section
	 * crossing the top of the screen rather than whichever happens to occupy
	 * the most pixels.
	 */
	useEffect(() => {
		let frame = 0;

		/*
		 * The current section is the last one whose top has passed under the
		 * header. Not "which section is visible" — sections abut exactly, so at
		 * a boundary two of them qualify and picking by document order sticks on
		 * the one you have already left.
		 *
		 * Deliberately not an IntersectionObserver. That reports changes rather
		 * than state: a fragment jump fires it once mid-scroll and never again
		 * at the final position, leaving the wrong section marked. Reading four
		 * rects per animation frame, only while scrolling, is cheaper than being
		 * wrong.
		 */
		const resolve = () => {
			frame = 0;

			let current: string | null = null;

			for (const item of navigation) {
				const element = document.getElementById(item.id);
				if (element && element.getBoundingClientRect().top <= 57) {
					current = item.id;
				}
			}

			setActiveId(current);
		};

		const schedule = () => {
			if (frame) return;
			frame = window.requestAnimationFrame(resolve);
		};

		// Scheduled rather than called, so the first read happens after layout.
		schedule();

		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule, { passive: true });

		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, []);

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
						{navigation.map((item) => {
							const isActive = activeId === item.id;

							return (
								<Link
									key={item.id}
									href={`/#${item.id}`}
									aria-current={isActive ? "true" : undefined}
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
									{item.label}
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
					{navigation.map((item, index) => (
						<Link
							key={item.id}
							href={`/#${item.id}`}
							onClick={() => setIsOpen(false)}
							className="fx-bleed flex items-baseline gap-4 border-b border-border py-4"
						>
							<span className="fx-eyebrow text-accent tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>
							<span
								className={
									activeId === item.id ? "text-foreground" : "text-muted"
								}
							>
								{item.label}
							</span>
						</Link>
					))}

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
