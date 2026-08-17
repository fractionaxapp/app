/*
 * "Normalised into one schema" sounds like plumbing. It is actually the reason
 * a shortlist can exist at all: four venues describing the same quantity four
 * different ways cannot be sorted until someone decides they are the same
 * column.
 *
 * Deliberately not another before-and-after panel — the Underwrite page already
 * does that, and this is a different problem. There the difficulty is prose;
 * here it is vocabulary.
 */

const fields = [
	{
		field: "net_yield",
		description: "Return after fees, annualised",
		variants: [
			"Coupon (p.a.)",
			"Target Net Yield",
			"Return, net of fees",
			"Distribution Rate",
		],
	},
	{
		field: "term_months",
		description: "Time to maturity",
		variants: ["Maturity", "Tenor", "Term (mo)", "Investment Horizon"],
	},
	{
		field: "minimum",
		description: "Smallest accepted allocation",
		variants: ["Min. Subscription", "Minimum Ticket", "Entry Size"],
	},
	{
		field: "seniority",
		description: "Position in the capital stack",
		variants: ["Rank", "Priority", "Security", "Tranche"],
	},
];

export function DiscoverySchema() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">One schema</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						No two venues name the same quantity the same way. Nothing can be
						compared until they do.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border">
						<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
							<p className="fx-eyebrow text-muted">Field mapping</p>
							<p className="fx-eyebrow text-accent">Four examples</p>
						</div>

						<dl>
							{fields.map((entry) => (
								<div
									key={entry.field}
									className="grid gap-x-8 gap-y-4 border-b border-border px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
								>
									<dt>
										<p className="font-mono text-sm text-accent">
											{entry.field}
										</p>
										<p className="mt-1.5 text-sm text-muted">
											{entry.description}
										</p>
									</dt>

									<dd>
										<p className="fx-eyebrow text-muted">Seen as</p>
										<ul className="mt-2.5 flex flex-wrap gap-2">
											{entry.variants.map((variant) => (
												<li
													key={variant}
													className="border border-border px-2.5 py-1.5 font-mono text-xs text-muted"
												>
													{variant}
												</li>
											))}
										</ul>
									</dd>
								</div>
							))}
						</dl>
					</div>

					<p className="mt-5 text-sm text-pretty text-muted">
						Representative labels, not a directory of any one venue. The mapping
						is unglamorous and it is most of the work — a shortlist sorted by
						yield means nothing until every row&rsquo;s yield means the same
						thing.
					</p>
				</div>
			</div>
		</section>
	);
}
