import { SectionHeading } from "./ui";

const frictions = [
	{
		title: "Fragmented discovery",
		body: "167 issuance platforms and no shared index. Finding the deal is its own research project.",
	},
	{
		title: "Manual underwriting",
		body: "Every deal arrives as a PDF. Comparing two of them means rebuilding both by hand.",
	},
	{
		title: "Per-asset eligibility",
		body: "Cleared at one issuer, blocked at the next. The same identity, re-proved every time.",
	},
	{
		title: "Blind portfolios",
		body: "Distributions and covenants tracked in spreadsheets, discovered late or not at all.",
	},
];

export function Problem() {
	return (
		<section
			id="problem"
			className="fx-section fx-bleed scroll-mt-14 bg-surface"
		>
			<SectionHeading
				eyebrow="The problem"
				title="Buying takes thirty seconds. Deciding takes three weeks"
				copy="Settlement is solved. The three weeks in front of it are entirely human, and none of that work carries over to the next deal."
			/>

			{/* The imbalance, stated at display scale before it is explained. */}
			<div className="mt-[clamp(48px,6vw,96px)] grid gap-px bg-border sm:grid-cols-2">
				<div className="bg-surface px-6 py-10 sm:px-8 sm:py-14">
					<p className="font-mono text-[clamp(44px,6vw,92px)] leading-none tracking-[-0.04em] text-muted tabular-nums">
						00:30
					</p>
					<p className="fx-eyebrow mt-6 text-muted">
						To buy, once you have decided
					</p>
				</div>

				<div className="bg-surface px-6 py-10 sm:px-8 sm:py-14">
					<p className="font-mono text-[clamp(44px,6vw,92px)] leading-none tracking-[-0.04em] text-accent tabular-nums">
						3 weeks
					</p>
					<p className="fx-eyebrow mt-6 text-muted">
						To decide, every hour of it human
					</p>
				</div>
			</div>

			<div className="mt-px grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				{frictions.map((friction, index) => (
					<article key={friction.title} className="bg-surface p-6 sm:p-8">
						<span className="fx-eyebrow text-accent tabular-nums">
							{String(index + 1).padStart(2, "0")}
						</span>
						<h3 className="mt-5 text-lg leading-tight font-extrabold tracking-[-0.03em] uppercase">
							{friction.title}
						</h3>
						<p className="mt-3 text-sm text-pretty text-muted">
							{friction.body}
						</p>
					</article>
				))}
			</div>

			<p className="mt-[clamp(40px,5vw,72px)] max-w-4xl text-[clamp(20px,2vw,32px)] leading-[1.25] text-pretty">
				A $25K allocation takes the same human work as a $25M one.{" "}
				<span className="text-muted">Which is why nobody does the small ones.</span>
			</p>
		</section>
	);
}
