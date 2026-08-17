/*
 * The claim this page makes is that documents become comparable fields. Saying
 * so is cheap; showing the same clause in both forms is not, and it is the one
 * thing a reader can check for themselves.
 *
 * The numbered markers do the linking. Hover would be prettier, but it needs
 * JavaScript, dies on touch, and cannot be printed — numbers work everywhere
 * and make the mapping explicit rather than discoverable.
 *
 * The excerpt is written to look like the real thing in the ways that matter:
 * figures spelled out in words, the term buried mid-clause, and a covenant
 * whose test frequency disagrees with the reporting schedule. That last one is
 * what the flag below picks up.
 */

const extracted = [
	{ index: 1, label: "Net yield", value: "9.2%" },
	{ index: 2, label: "Coupon", value: "Quarterly, in arrears" },
	{ index: 3, label: "DSCR covenant", value: "≥ 1.50×" },
	{ index: 4, label: "Covenant test", value: "Quarterly" },
	{ index: 5, label: "Reporting", value: "Semi-annual" },
	{ index: 6, label: "Term", value: "24 months" },
	{ index: 7, label: "Seniority", value: "Senior secured" },
];

function Mark({ n, children }: { n: number; children: React.ReactNode }) {
	return (
		<mark className="bg-accent/15 px-0.5 text-foreground">
			{children}
			<sup className="ml-0.5 font-mono text-[0.65em] text-accent">{n}</sup>
		</mark>
	);
}

export function UnderwritingExtract() {
	return (
		<section className="fx-section fx-bleed">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">What it reads</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						The same clause, before and after. Seven fields out of one
						paragraph, including two that disagree with each other.
					</p>
				</div>

				<div className="lg:col-span-2">
					<div className="border border-border bg-surface">
						<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
							<p className="fx-eyebrow text-muted">
								Offering memo · illustrative excerpt
							</p>
							<p className="fx-eyebrow text-accent">7 fields</p>
						</div>

						<div className="grid gap-px bg-border lg:grid-cols-2">
							<div className="bg-surface px-5 py-6">
								<p className="fx-eyebrow text-muted">Source</p>

								<p className="mt-4 font-mono text-sm leading-relaxed text-muted">
									&hellip; the Notes shall bear interest at a rate of{" "}
									<Mark n={1}>nine and two-tenths percent (9.2%)</Mark> per
									annum, payable <Mark n={2}>quarterly in arrears</Mark>{" "}
									commencing on the first Payment Date following the Closing
									Date. The Issuer shall at all times maintain a Debt Service
									Coverage Ratio of{" "}
									<Mark n={3}>not less than 1.50 to 1.00</Mark>, such ratio to
									be tested <Mark n={4}>as of the last day of each fiscal
									quarter</Mark> and certified to the Trustee together with the{" "}
									<Mark n={5}>semi-annual financial statements</Mark> required
									under Section 7.2. The Notes shall mature{" "}
									<Mark n={6}>twenty-four (24) months</Mark> from the Closing
									Date and shall rank as{" "}
									<Mark n={7}>senior secured obligations</Mark>
									{" of the Issuer …"}
								</p>
							</div>

							<div className="bg-surface px-5 py-6">
								<p className="fx-eyebrow text-muted">Extracted</p>

								<dl className="mt-4">
									{extracted.map((field) => (
										<div
											key={field.label}
											className="flex items-baseline gap-4 border-b border-border py-2.5 last:border-b-0"
										>
											<span className="fx-eyebrow w-4 shrink-0 text-accent tabular-nums">
												{field.index}
											</span>
											<dt className="fx-eyebrow flex-1 text-muted">
												{field.label}
											</dt>
											<dd className="font-mono text-sm tabular-nums">
												{field.value}
											</dd>
										</div>
									))}
								</dl>
							</div>
						</div>

						{/*
						 * The point of extracting fields rather than summarising prose:
						 * once both are values, a contradiction between them is
						 * detectable instead of being something a reader has to notice.
						 */}
						<div className="flex gap-3 border-t border-border bg-accent/[0.06] px-5 py-4">
							<span aria-hidden className="mt-0.5 text-accent">
								!
							</span>
							<p className="text-sm text-pretty text-muted">
								<strong className="font-semibold text-foreground">
									Flag: covenant tested quarterly, reported semi-annually.
								</strong>{" "}
								Fields 4 and 5 disagree — the ratio is tested twice as often as
								the issuer is required to report it, so two of every four tests
								arrive unverified. Worth asking about before you commit.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
