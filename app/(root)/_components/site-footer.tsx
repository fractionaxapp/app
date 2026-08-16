import Link from "next/link";

import { Wordmark } from "./logo";

/*
 * Product and Access point at real destinations. Legal does not yet — those
 * three pages need writing before launch, and a footer full of links that go
 * nowhere is worse than a short one.
 */
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
			{ href: "/#privacy", label: "Privacy" },
			{ href: "/#terms", label: "Terms" },
			{ href: "/#disclosures", label: "Disclosures" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer>
			<div className="fx-bleed grid gap-10 py-[clamp(48px,6vw,88px)] sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
				<div className="flex flex-col items-start gap-6">
					<Wordmark />

					{/*
					 * The line that used to be a whole closing section. It was too
					 * grand to carry a band of its own on a page for people deciding
					 * whether to sign up — but it makes a good sign-off.
					 */}
					<p className="max-w-sm text-[clamp(17px,1.5vw,22px)] leading-[1.3] text-balance">
						Today, software helps investors make decisions.{" "}
						<span className="text-muted">
							Tomorrow, software will make and execute them.
						</span>
					</p>

					<p className="fx-eyebrow border border-accent px-2.5 py-1 text-accent">
						Private beta
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
										className="transition-colors hover:text-primary"
									>
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
			 * than sitting politely on a baseline. Hovering fills it.
			 */}
			<div
				aria-hidden
				className="fx-bleed @container overflow-hidden border-t border-border pt-[clamp(32px,5vw,80px)]"
			>
				{/*
				 * Sized in cqw, not vw. The gutter grows non-linearly past 1680px,
				 * so a viewport-relative size overshoots the column on wide screens
				 * and clips the last letter. Container units track the column it
				 * actually sits in, holding the same 93% fill at every width.
				 */}
				<p
					style={{ WebkitTextStrokeWidth: "2px" }}
					className="fx-outline mb-[-0.16em] block text-[clamp(40px,15.5cqw,340px)] leading-[0.84] font-extrabold tracking-[-0.055em] whitespace-nowrap uppercase select-none"
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
