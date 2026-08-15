import Link from "next/link";

import { Wordmark } from "./logo";

const groups = [
	{
		heading: "Platform",
		links: [
			{ href: "/#workflow", label: "Workflow" },
			{ href: "/#platform", label: "Surfaces" },
			{ href: "/#why-now", label: "Why now" },
		],
	},
	{
		heading: "Company",
		links: [
			{ href: "/#contact", label: "Contact" },
			{ href: "/#careers", label: "Careers" },
			{ href: "/dashboard", label: "Sign in" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ href: "/#privacy", label: "Privacy" },
			{ href: "/#terms", label: "Terms" },
			{ href: "/#disclosures", label: "Disclosures" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer>
			<div className="fx-bleed grid gap-10 py-[clamp(48px,6vw,88px)] sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
				<div>
					<Wordmark />
					<p className="mt-5 max-w-xs text-pretty text-muted">
						Agentic infrastructure for private-market investing.
					</p>
				</div>

				{groups.map((group) => (
					<nav key={group.heading} aria-labelledby={`footer-${group.heading}`}>
						<h2 id={`footer-${group.heading}`} className="fx-eyebrow text-muted">
							{group.heading}
						</h2>

						<ul className="mt-5 flex flex-col gap-3">
							{group.links.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="transition-colors hover:text-accent"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				))}
			</div>

			{/* The name at closing scale, clipped by the viewport edge. */}
			<div
				aria-hidden
				className="fx-bleed overflow-hidden border-t border-border pt-[clamp(28px,4vw,64px)]"
			>
				<p className="fx-display text-surface-muted select-none">Fractionax</p>
			</div>

			<div className="fx-bleed flex flex-col gap-4 border-t border-border py-7 sm:flex-row sm:items-center sm:justify-between">
				<p className="fx-eyebrow text-muted">
					© {new Date().getFullYear()} Fractionax
				</p>

				<p className="fx-eyebrow text-muted">
					Discover · Underwrite · Execute · Monitor
				</p>
			</div>

			<div className="fx-bleed border-t border-border py-6">
				<p className="max-w-3xl text-xs text-pretty text-muted">
					Nothing here is an offer to sell or a solicitation to buy any
					security. Private-market investments carry risk of total loss.
				</p>
			</div>
		</footer>
	);
}
