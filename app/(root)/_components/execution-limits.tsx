/*
 * The honest boundary of the policy idea, and the most important sentence on
 * this page: a trade inside your limits is permitted, not endorsed. Limits
 * constrain size and venue. They cannot price risk, and a page that shows a
 * policy blocking a bad-looking trade owes the reader that distinction.
 *
 * The first three are settlement realities. Anyone who has moved money
 * on-chain knows them, and pretending otherwise is how you lose the reader who
 * matters most.
 */

const limits = [
	{
		title: "A cleared allocation can still be refused",
		body: "Eligibility is re-confirmed at execution, but the issuer holds the final say and can decline for reasons it does not have to give. The sequence stops before anything is committed.",
	},
	{
		title: "Settlement can stall or fail",
		body: "Network congestion, a venue outage, an issuer that does not deliver on time. A broadcast transfer is subject to whatever the chain does next, and that is outside anyone's control.",
	},
	{
		title: "The size available may not be the size approved",
		body: "An allocation can be partially filled if the offering closes while the trade is in flight. You are told what actually settled, not what was intended.",
	},
	{
		title: "Limits permit a trade, they do not endorse it",
		body: "A deal inside your size, venue and counterparty rules has satisfied constraints you set — nothing more. The policy cannot tell you whether the trade is a good idea, and nothing here is advice.",
	},
];

export function ExecutionLimits() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">Where it stops</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Four things a policy cannot do, however carefully it is written.
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
