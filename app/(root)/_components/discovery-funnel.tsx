/*
 * "Filtered by your mandate, not by a menu" is the page's third claim and the
 * hardest to picture. This shows the sentence being applied one clause at a
 * time, with what survives each one.
 *
 * Worth showing because the shape is informative on its own: the asset class
 * cuts hardest, and the yield floor — the clause people think is the demanding
 * one — is nearly the mildest. That is the sort of thing you only see when the
 * whole index is in one place.
 */

const TOTAL = 1284;

const steps = [
	{ label: "Indexed", clause: "Every offering under coverage", count: TOTAL },
	{ label: "Private credit", clause: "Asset class", count: 412 },
	{ label: "Asia exposure", clause: "Region", count: 186 },
	{ label: "Yielding 8%+", clause: "Yield floor", count: 94 },
	{ label: "Minimum under $25K", clause: "Ticket size", count: 51 },
	{ label: "Moderate risk", clause: "Risk band", count: 37 },
];

export function DiscoveryFunnel() {
	return (
		<section className="fx-section fx-bleed">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">What the mandate cuts</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						One sentence, applied clause by clause. The asset class does most of
						the work; the yield floor barely halves what is left.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border bg-surface">
						<div className="border-b border-border px-5 py-5">
							<p className="fx-eyebrow text-muted">The mandate</p>
							<p className="mt-3 font-mono text-sm leading-relaxed text-pretty sm:text-base">
								<span className="text-accent">&gt;</span> Private credit
								yielding 8%+, minimum under $25K, Asia exposure, moderate risk.
							</p>
						</div>

						<ol>
							{steps.map((step, index) => {
								const isLast = index === steps.length - 1;
								const width = (step.count / TOTAL) * 100;

								return (
									<li
										key={step.label}
										className="border-b border-border px-5 py-4 last:border-b-0"
									>
										<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
											<p className="flex items-baseline gap-3">
												<span className="fx-eyebrow text-muted tabular-nums">
													{String(index).padStart(2, "0")}
												</span>
												<span
													className={`text-sm ${isLast ? "font-semibold" : ""}`}
												>
													{step.label}
												</span>
												<span className="fx-eyebrow hidden text-muted sm:inline">
													{step.clause}
												</span>
											</p>

											<p
												className={`font-mono text-sm tabular-nums ${
													isLast ? "text-accent" : "text-muted"
												}`}
											>
												{step.count.toLocaleString("en-GB")}
											</p>
										</div>

										{/* Proportional to the whole index, so the collapse is
										    visible rather than each step being redrawn full-width. */}
										<div className="mt-2.5 h-1 bg-border">
											<div
												className={`h-full min-w-0.5 ${
													isLast ? "bg-accent" : "bg-muted/40"
												}`}
												style={{ width: `${width}%` }}
											/>
										</div>
									</li>
								);
							})}
						</ol>

						<p className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border bg-surface-muted px-5 py-4">
							<span className="fx-eyebrow text-muted">
								Survived every clause
							</span>
							<span className="font-mono text-sm tabular-nums">
								37 of 1,284 · 2.9%
							</span>
						</p>
					</div>

					<p className="mt-5 text-sm text-muted">
						Counts from an example run — see{" "}
						<a
							href="/disclosures"
							className="text-primary underline underline-offset-4"
						>
							disclosures
						</a>
						.
					</p>
				</div>
			</div>
		</section>
	);
}
