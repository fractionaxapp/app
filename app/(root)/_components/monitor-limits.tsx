/*
 * Completes the set — Discover, Underwrite and Execute each name where they
 * stop, and monitoring has the most consequential boundary of the four.
 *
 * The last item is the honest core of the page: early warning of something you
 * cannot escape is still worth having, but it is worth less than the rest of
 * the page might imply, and an illiquid position is the normal case rather
 * than the exception.
 */

const limits = [
	{
		title: "It cannot see between reporting dates",
		body: "A covenant tested quarterly is unobserved for three months at a time. What we track is what the issuer files, on the schedule the document sets — the gaps are real and the document defines them.",
	},
	{
		title: "Marks are modelled, not observed",
		body: "Without a liquid secondary market there is no price, only an estimate. A valuation between issuance and maturity is the best available inference, and it can be wrong in the direction you would least like.",
	},
	{
		title: "Reported data is read, not audited",
		body: "We parse what the issuer publishes and check it against the terms. Where an issuer misreports, monitoring inherits the error until something else contradicts it.",
	},
	{
		title: "Noticing is not fixing",
		body: "Knowing early is worth a great deal and it is not the same as being able to act. Private-market positions are usually illiquid — there may be no bid at any price, and nothing here changes that.",
	},
];

export function MonitorLimits() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">Where it stops</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Four things monitoring cannot do, however closely a position is
						watched.
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
