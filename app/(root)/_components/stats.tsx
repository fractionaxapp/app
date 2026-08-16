/*
 * Two cited market facts and two product truths. Nothing here is a measured
 * product metric — no "nine minutes" until there is a real number behind it.
 *
 * Lives below the fold rather than inside it. Keeping it in the hero cost the
 * headline the space it needs, and these are the least essential things there:
 * the first two are facts about the market, and the last two are restated in
 * the FAQ. Out here they can also be set larger.
 */

const stats = [
	{ figure: "$31B", label: "Tokenized real-world assets on-chain" },
	{ figure: "167", label: "Issuance platforms under coverage" },
	{ figure: "$25,000", label: "Minimum allocation" },
	{ figure: "Your call", label: "Approve each trade, or let it run" },
];

export function Stats() {
	return (
		/*
		 * Full bleed, so the rules reach the screen edge — but each cell carries
		 * the gutter as its own left padding, which keeps the first figure in
		 * the same column as everything else and gives every other figure the
		 * same offset from its own divider.
		 */
		<dl className="grid gap-px border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.figure}
					className="bg-background py-8 pr-5 pl-[var(--gutter)]"
				>
					<dt className="font-mono text-[clamp(24px,2.6vw,44px)] leading-none font-medium tracking-tight text-accent tabular-nums">
						{stat.figure}
					</dt>
					<dd className="fx-eyebrow mt-3.5 text-muted">{stat.label}</dd>
				</div>
			))}
		</dl>
	);
}
