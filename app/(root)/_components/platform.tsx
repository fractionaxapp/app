import { SectionHeading } from "./ui";

/*
 * Six primitives drawn as a stack rather than a card grid — the section is
 * called Underneath, and a spine running down through six strata says that
 * better than six equal boxes.
 *
 * Each layer states the chore first and strikes it out, because the heading
 * promises six things you do not have to do and a card that only lists the
 * benefit never shows what was taken away. This is also where the substance
 * of the old problem-statement section went: the frictions are still here,
 * attached to the thing that removes them instead of standing alone.
 */

const layers = [
	{
		name: "Identity",
		chore: "Prove accreditation to every issuer, one at a time",
		claim: "Verified once, reused everywhere",
		body: "Prove it a single time. Every issuer that accepts your verification clears you without another form.",
	},
	{
		name: "Eligibility",
		chore: "Find out you are not permitted after you have chosen",
		claim: "Resolved before you see the deal",
		body: "Jurisdiction, accreditation and transfer restrictions checked per asset, so nothing on your shortlist is something you cannot actually buy.",
	},
	{
		name: "Asset data",
		chore: "Rebuild every offering memo into your own spreadsheet",
		claim: "Every document, one schema",
		body: "Memos, term sheets, payment histories and secondary marks parsed into the same comparable fields.",
	},
	{
		name: "Underwriting",
		chore: "Skip the small deals because the work does not pay",
		claim: "The same model on every deal",
		body: "No offering gets a lighter read because the cheque is small. A $25K allocation is underwritten like a $25M one.",
	},
	{
		name: "Execution",
		chore: "Police your own size and counterparty limits each trade",
		claim: "Inside the limits you set",
		body: "Settlement on-chain, bounded by the size, venue and counterparty rules attached to your mandate.",
	},
	{
		name: "Portfolio",
		chore: "Track distributions in a spreadsheet and hope",
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

			{/*
			 * Rows fill teal on hover, so everything inside inverts with the
			 * fill — foreground for the text, the dark ground for marks that
			 * were teal already. Each row also pulls the gutter back and repays
			 * it as its own padding, so the fill reaches the screen edges while
			 * the content stays in the column.
			 */}
			<ol className="mt-[clamp(48px,6vw,96px)] border-y border-border">
				{layers.map((layer, index) => (
					<li
						key={layer.name}
						className="fx-bleed group -mx-[var(--gutter)] grid gap-x-8 gap-y-5 border-t border-border py-7 transition-colors first:border-t-0 hover:bg-primary hover:text-primary-foreground md:grid-cols-[4.5rem_1fr] lg:grid-cols-[4.5rem_1.1fr_1.3fr]"
					>
						{/*
						 * The spine. One continuous rule through every layer, with each
						 * index sitting on it as a node — which is what makes six rows
						 * read as a cross-section instead of a list.
						 */}
						<div className="relative">
							<span
								aria-hidden
								className="absolute top-[-1.75rem] bottom-[-1.75rem] left-[3px] w-px bg-surface-muted group-hover:bg-primary-foreground/20"
							/>
							<span
								aria-hidden
								className="absolute top-1.5 left-0 size-1.5 bg-accent transition-colors group-hover:bg-primary-foreground"
							/>
							<span className="fx-eyebrow block pl-6 text-muted transition-colors tabular-nums group-hover:text-primary-foreground/70">
								{String(index + 1).padStart(2, "0")}
							</span>
						</div>

						<div>
							<p className="fx-eyebrow text-muted transition-colors group-hover:text-primary-foreground/70">
								{layer.name}
							</p>
							<h3 className="mt-3 text-[clamp(19px,1.9vw,30px)] leading-[1.06] font-extrabold tracking-[-0.04em] text-balance uppercase">
								{layer.claim}
							</h3>
						</div>

						<div className="lg:pt-1">
							{/*
							 * The chore, struck out — set in sans rather than the mono
							 * used for labels. Mono uppercase under a strikethrough is
							 * dense enough to stop being readable.
							 */}
							<p className="flex gap-2.5 text-sm text-muted/70 transition-colors group-hover:text-primary-foreground/60">
								<span aria-hidden>✕</span>
								<s className="decoration-current/50">{layer.chore}</s>
							</p>

							<p className="mt-3 max-w-xl text-sm text-pretty text-muted transition-colors group-hover:text-primary-foreground/85">
								{layer.body}
							</p>
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}
