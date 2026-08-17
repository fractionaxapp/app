/*
 * "Limits bind either way" is the page's second claim, and limits stated in
 * prose are not limits — they are reassurance. This shows them as values,
 * because a number you can read is a number you could check.
 *
 * The values are illustrative; the four categories are not. They are the same
 * ones named in the Control section on the home page and in the terms.
 */

const groups = [
	{
		heading: "Size",
		rules: [
			// Above the $25,000 product floor, or nothing could ever settle.
			{ label: "Maximum per allocation", value: "$25,000" },
			{ label: "Maximum total exposure", value: "$100,000" },
			{ label: "Maximum per issuer", value: "$40,000" },
		],
	},
	{
		heading: "Venue",
		rules: [
			{ label: "Settlement venues", value: "3 approved" },
			{ label: "Unlisted venues", value: "Blocked" },
		],
	},
	{
		heading: "Counterparty",
		rules: [
			{ label: "Issuer allowlist", value: "Enforced" },
			{ label: "New counterparties", value: "Require approval" },
		],
	},
	{
		heading: "Asset class",
		rules: [
			{ label: "Permitted", value: "Private credit, trade finance" },
			{ label: "Everything else", value: "Out of mandate" },
		],
	},
];

export function ExecutionPolicy() {
	return (
		<section className="fx-section fx-bleed">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">The policy</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Limits described in a sentence are reassurance. Limits with values
						are something you can hold us to.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border bg-surface">
						<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
							<p className="fx-eyebrow text-muted">Mandate policy</p>
							<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
								<span aria-hidden className="size-1.5 bg-primary" />
								Enforced on every trade
							</p>
						</div>

						<div className="grid gap-px bg-border sm:grid-cols-2">
							{groups.map((group) => (
								<div key={group.heading} className="bg-surface px-5 py-5">
									<p className="fx-eyebrow text-accent">{group.heading}</p>

									<dl className="mt-3">
										{group.rules.map((rule) => (
											<div
												key={rule.label}
												className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-b border-border py-2.5 last:border-b-0"
											>
												<dt className="text-sm text-muted">{rule.label}</dt>
												<dd className="font-mono text-sm tabular-nums">
													{rule.value}
												</dd>
											</div>
										))}
									</dl>
								</div>
							))}
						</div>

						<p className="border-t border-border px-5 py-4 text-sm text-pretty text-muted">
							<strong className="font-semibold text-foreground">
								The agent cannot edit this.
							</strong>{" "}
							Changing a limit is something you do, and it takes effect on the
							next run — not on the trade currently in front of you.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
