import Link from "next/link";

import { LogoMark } from "@/app/_components/logo";

/* Every link here resolves to a real destination. */
const groups = [
	{
		heading: "Product",
		links: [
			{ href: "/#workflow", label: "How it works" },
			{ href: "/#control", label: "Control" },
			{ href: "/#platform", label: "Underneath" },
			{ href: "/#faq", label: "Questions" },
		],
	},
	{
		heading: "Access",
		links: [
			{ href: "/#start", label: "Compose a mandate" },
			{ href: "/dashboard", label: "Join the private beta" },
		],
	},
	{
		heading: "Legal",
		links: [
			{ href: "/privacy", label: "Privacy" },
			{ href: "/terms", label: "Terms" },
			{ href: "/disclosures", label: "Disclosures" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer>
			{/*
			 * Divided rather than spaced. Every other band on the page is built
			 * from cells separated by hairlines; the footer was the one place
			 * still using plain gaps. divide-x rather than a gap-px sheet, so the
			 * first cell keeps no left padding and stays in the gutter column.
			 */}
			<div className="fx-bleed grid gap-y-12 border-b border-border py-[clamp(48px,6vw,88px)] sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)] lg:gap-y-0 lg:divide-x lg:divide-border">
				{/*
				 * Headed like the three columns beside it rather than led by a
				 * lockup, so all four read as one row. The brand does not need
				 * stating here — it is about to be set at 240px directly below.
				 */}
				<div className="lg:pr-12">
					<h2
						id="footer-brand"
						className="fx-eyebrow flex items-center gap-2.5 text-muted"
					>
						<LogoMark className="size-3 text-primary" />
						Fractionax
					</h2>

					<p className="mt-6 max-w-xs text-pretty text-muted">
						AI agents that find, underwrite and execute private-market
						investments on-chain.
					</p>

					<p className="fx-eyebrow mt-6 inline-flex items-center gap-2.5 border border-border px-3 py-2">
						<span aria-hidden className="size-1.5 shrink-0 bg-primary" />
						Private beta · limited cohort
					</p>
				</div>

				{groups.map((group) => (
					<nav
						key={group.heading}
						aria-labelledby={`footer-${group.heading}`}
						className="lg:px-12 lg:last:pr-0"
					>
						<h2 id={`footer-${group.heading}`} className="fx-eyebrow text-muted">
							{group.heading}
						</h2>

						<ul className="mt-6 flex flex-col gap-3.5">
							{group.links.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="group flex items-center gap-2.5 transition-colors hover:text-primary"
									>
										{/* Always occupies its space, so nothing shifts. Same
										    marker the header uses for the current section. */}
										<span
											aria-hidden
											className="size-1 shrink-0 bg-primary opacity-0 transition-opacity group-hover:opacity-100"
										/>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				))}
			</div>

			{/*
			 * The name at closing scale — hollow, like the marquee and the workflow
			 * verbs, and cropped along the bottom so it runs off the page rather
			 * than sitting politely on a baseline. It fills left to right as you
			 * reach it, which is the page's own gesture used one last time.
			 */}
			<div
				aria-hidden
				className="fx-bleed @container overflow-hidden pt-[clamp(32px,5vw,80px)]"
			>
				{/*
				 * Sized in cqw, not vw. The gutter grows non-linearly past 1680px,
				 * so a viewport-relative size overshoots the column on wide screens
				 * and clips the last letter. Container units track the column it
				 * actually sits in, holding the same 93% fill at every width.
				 */}
				<p
					style={{ WebkitTextStrokeWidth: "2px" }}
					className="fx-outline fx-wipe mb-[-0.16em] block text-[clamp(40px,15.5cqw,340px)] leading-[0.84] font-extrabold tracking-[-0.055em] whitespace-nowrap uppercase select-none"
				>
					Fractionax
				</p>
			</div>

			<div className="fx-bleed grid gap-x-10 gap-y-6 border-t border-border py-7 md:grid-cols-[1fr_1.4fr]">
				<div className="flex flex-col gap-2.5">
					<p className="fx-eyebrow text-muted">
						© {new Date().getFullYear()} Fractionax
					</p>
					<p className="fx-eyebrow text-muted">
						Discover · Underwrite · Execute · Monitor
					</p>
				</div>

				<p className="max-w-2xl text-xs text-pretty text-muted">
					Nothing here is an offer to sell or a solicitation to buy any
					security. Private-market investments carry risk of total loss.
				</p>
			</div>
		</footer>
	);
}
