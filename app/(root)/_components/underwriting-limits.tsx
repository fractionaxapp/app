/*
 * A page that claims a model reads every deal should say where reading stops.
 *
 * This is not hedging. The audience is people who underwrite for a living and
 * who will assume any tool overstates itself; naming the boundary is how the
 * rest of the page becomes credible. It also keeps the marketing page and the
 * disclosures saying the same thing, which is worth more than either alone.
 */

const limits = [
	{
		title: "Whether the issuer will honour the terms",
		body: "The document is evidence of an intention, not of an outcome. Underwriting reads what was promised; it cannot read who keeps promises.",
	},
	{
		title: "Whether the collateral is what the document says",
		body: "Receivables, property, equipment — their existence and condition are asserted by the issuer. Verifying them is fieldwork, and fieldwork is not parsing.",
	},
	{
		title: "What happens in conditions that have not occurred",
		body: "A model reads history and terms. It does not know what a market that has never happened will do to a covenant that has never been tested.",
	},
	{
		title: "Whether a sound deal is right for you",
		body: "Structure, coverage and seniority are properties of the offering. Suitability is a property of your circumstances, and that is a judgement we do not make for you.",
	},
];

export function UnderwritingLimits() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">Where it stops</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Four things underwriting cannot tell you, however well the documents
						are read.
					</p>
				</div>

				<ol className="min-w-0 border-t border-border lg:col-span-2">
					{limits.map((limit, index) => (
						<li
							key={limit.title}
							className="grid gap-x-6 gap-y-3 border-b border-border py-6 sm:grid-cols-[2.5rem_1fr]"
						>
							<span className="fx-eyebrow text-muted tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>

							<div>
								<h2 className="text-[clamp(17px,1.5vw,22px)] leading-tight font-extrabold tracking-[-0.03em] text-balance uppercase">
									{limit.title}
								</h2>
								<p className="mt-2.5 max-w-2xl text-pretty text-muted">
									{limit.body}
								</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
