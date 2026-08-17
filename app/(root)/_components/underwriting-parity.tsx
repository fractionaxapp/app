/*
 * The company's central economic claim: a small allocation costs the same to
 * underwrite as a large one, which is the only reason small allocations are
 * worth making at all. It was a bullet point on this page and nothing else.
 *
 * The demonstration is the sameness itself. Every row is identical until the
 * last, and the last is the only thing that differs — so the table makes the
 * argument by its shape before anyone reads a number.
 */

const rows = [
	{ label: "Documents read", small: "47 pages", large: "47 pages" },
	{ label: "Fields extracted", small: "61", large: "61" },
	{ label: "Comparable set", small: "37 offerings", large: "37 offerings" },
	{ label: "Flags raised", small: "2", large: "2" },
	{ label: "Analyst hours", small: "0", large: "0" },
];

export function UnderwritingParity() {
	return (
		<section className="fx-section fx-bleed">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">The same work, either way</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						A $25K allocation takes the same human work as a $25M one. That is
						why nobody does the small ones — and why we can.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border bg-surface">
						<div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border">
							<p className="fx-eyebrow px-5 py-3.5 text-muted">
								Underwriting a
							</p>
							<p className="fx-eyebrow border-l border-border px-4 py-3.5 text-right text-muted">
								Small ticket
							</p>
							<p className="fx-eyebrow border-l border-border px-5 py-3.5 text-right text-muted">
								Large ticket
							</p>
						</div>

						<dl>
							{rows.map((row) => (
								<div
									key={row.label}
									className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border"
								>
									<dt className="px-5 py-4 text-sm text-muted">{row.label}</dt>
									<dd className="border-l border-border px-4 py-4 text-right font-mono text-sm tabular-nums">
										{row.small}
									</dd>
									<dd className="border-l border-border px-5 py-4 text-right font-mono text-sm tabular-nums">
										{row.large}
									</dd>
								</div>
							))}

							{/* The one row that differs, which is the whole argument. */}
							<div className="grid grid-cols-[1.2fr_1fr_1fr] bg-surface-muted">
								<dt className="px-5 py-5 text-sm font-semibold">Amount</dt>
								<dd className="border-l border-border px-4 py-5 text-right font-mono text-sm text-accent tabular-nums">
									$25,000
								</dd>
								<dd className="border-l border-border px-5 py-5 text-right font-mono text-sm text-accent tabular-nums">
									$25,000,000
								</dd>
							</div>
						</dl>
					</div>

					<p className="mt-5 text-sm text-pretty text-muted">
						Counts from an example run — see{" "}
						<a
							href="/disclosures"
							className="text-primary underline underline-offset-4"
						>
							disclosures
						</a>
						. Under manual review the left-hand column does not get written at
						all, because three weeks of analyst time cannot be justified against
						a $25,000 cheque. That is the whole gap this closes.
					</p>
				</div>
			</div>
		</section>
	);
}
