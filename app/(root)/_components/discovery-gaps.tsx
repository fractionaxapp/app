/*
 * "Every tokenized offering, in one index" is a strong headline and it is not
 * literally true, because a great deal of private-market supply is never
 * published anywhere. Saying so on the page that makes the claim is worth more
 * than being caught on it later by someone who knows the market.
 *
 * The fourth item is a policy rather than a limitation, and it is the one that
 * matters most: an offering we cannot parse well enough to compare is left out
 * rather than shown half-read. A shortlist is only useful if every row on it
 * means the same thing, which is the argument the Underwrite page makes.
 */

const gaps = [
	{
		title: "Deals that are never published",
		body: "Bilateral and club transactions arranged between parties who already know each other. They are a real share of private markets, and no index can contain what was never offered.",
	},
	{
		title: "Single-distributor placements",
		body: "Offerings sold exclusively through one bank or platform, visible only to its clients. We index them when they surface publicly and not before.",
	},
	{
		title: "Venues that refuse automated access",
		body: "Some platforms publish only behind a login or block crawlers outright. We do not work around that; those offerings are absent until the venue makes them readable.",
	},
	{
		title: "Anything we cannot parse cleanly",
		body: "An offering whose documents will not yield comparable fields is excluded rather than listed half-read. A shortlist is only worth sorting if every row means the same thing.",
	},
];

export function DiscoveryGaps() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">What is not in the index</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						&ldquo;Every tokenized offering&rdquo; is the goal, not a completed
						claim. Four things it does not include.
					</p>
				</div>

				<ol className="min-w-0 border-t border-border lg:col-span-2">
					{gaps.map((gap, index) => (
						<li
							key={gap.title}
							className="grid gap-x-6 gap-y-3 border-b border-border py-6 sm:grid-cols-[2.5rem_1fr]"
						>
							<span className="fx-eyebrow text-muted tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>

							<div>
								<h2 className="text-[clamp(17px,1.5vw,22px)] leading-tight font-extrabold tracking-[-0.03em] text-balance uppercase">
									{gap.title}
								</h2>
								<p className="mt-2.5 max-w-2xl text-pretty text-muted">
									{gap.body}
								</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
