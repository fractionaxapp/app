import { SectionHeading } from "./ui";

/*
 * Reframed from six API endpoints to six outcomes.
 *
 * The audience here allocates capital; it does not integrate. The old version
 * also led with Tokenization, which is the one thing the hero says everyone
 * else does — the section was arguing against its own headline.
 */

const surfaces = [
	{
		title: "Identity",
		claim: "Verified once, reused everywhere",
		body: "Prove accreditation a single time. Every issuer that accepts it clears you without another form.",
	},
	{
		title: "Eligibility",
		claim: "Resolved before you see the deal",
		body: "Jurisdiction, accreditation and transfer restrictions checked per asset, so nothing on your shortlist is something you cannot actually buy.",
	},
	{
		title: "Asset data",
		claim: "Every document, one schema",
		body: "Offering memos, term sheets, payment histories and secondary marks parsed into the same comparable fields.",
	},
	{
		title: "Underwriting",
		claim: "The same model on every deal",
		body: "No offering gets a lighter read because the cheque is small. A $25K allocation is underwritten like a $25M one.",
	},
	{
		title: "Execution",
		claim: "Inside the limits you set",
		body: "Settlement on-chain, bounded by the size, venue and counterparty rules attached to your mandate.",
	},
	{
		title: "Portfolio",
		claim: "Watched after the trade",
		body: "Distributions, covenants and marks tracked continuously by the model that underwrote the position.",
	},
];

export function Platform() {
	return (
		<section id="platform" className="fx-section fx-bleed scroll-mt-14">
			<SectionHeading
				eyebrow="Underneath"
				title="Six things the agent does not ask you to do"
				copy="Most of the work in a private-market allocation is administrative. None of it is yours."
			/>

			<div className="mt-[clamp(48px,6vw,96px)] grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
				{surfaces.map((surface, index) => (
					<article
						key={surface.title}
						className="bg-background p-6 transition-colors hover:bg-surface sm:p-8"
					>
						<p className="fx-eyebrow flex items-baseline gap-3 text-muted">
							<span className="text-accent tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>
							{surface.title}
						</p>

						<h3 className="mt-5 text-lg leading-tight font-extrabold tracking-[-0.03em] uppercase">
							{surface.claim}
						</h3>

						<p className="mt-3 text-sm text-pretty text-muted">{surface.body}</p>
					</article>
				))}
			</div>
		</section>
	);
}
