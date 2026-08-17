/*
 * "Read by the model that underwrote it" is the page's third claim, and it is
 * only meaningful if the comparison is against the original parsed fields
 * rather than against last quarter. These are the same values the Underwrite
 * page extracts from the offering memo.
 *
 * Covenant headroom is the row that matters and it is derived, not reported:
 * the distance between actual coverage and the floor the document sets. No
 * issuer publishes it, because no issuer wants to.
 */

const rows = [
	{
		field: "DSCR",
		underwritten: "1.80×",
		latest: "1.52×",
		delta: "−0.28",
		drifting: true,
	},
	{
		field: "Covenant headroom",
		underwritten: "0.30×",
		latest: "0.02×",
		delta: "−0.28",
		drifting: true,
		derived: true,
	},
	{
		field: "Coupon timeliness",
		underwritten: "On time",
		latest: "3 days late",
		delta: "—",
		drifting: true,
	},
	{
		field: "Net yield",
		underwritten: "9.2%",
		latest: "9.2%",
		delta: "—",
		drifting: false,
	},
	{
		field: "Seniority",
		underwritten: "Senior secured",
		latest: "Senior secured",
		delta: "—",
		drifting: false,
	},
];

export function MonitorDrift() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">Against the original</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Compared with what the offering memo said, not with last quarter.
						Same fields, same parse, eleven months apart.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border">
						<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
							<p className="fx-eyebrow text-muted">Field drift</p>
							<p className="fx-eyebrow text-accent">3 of 5 moved</p>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full min-w-140 border-collapse text-left">
								<thead>
									<tr>
										<th
											scope="col"
											className="fx-eyebrow border-b border-border px-5 py-3 font-normal text-muted"
										>
											Field
										</th>
										<th
											scope="col"
											className="fx-eyebrow border-b border-border px-4 py-3 text-right font-normal text-muted"
										>
											At underwriting
										</th>
										<th
											scope="col"
											className="fx-eyebrow border-b border-border px-4 py-3 text-right font-normal text-muted"
										>
											Latest
										</th>
										<th
											scope="col"
											className="fx-eyebrow border-b border-border px-5 py-3 text-right font-normal text-muted"
										>
											Δ
										</th>
									</tr>
								</thead>

								<tbody>
									{rows.map((row) => (
										<tr
											key={row.field}
											className="border-b border-border last:border-b-0"
										>
											<th scope="row" className="px-5 py-4 font-normal">
												<span className="text-sm">{row.field}</span>
												{row.derived ? (
													<span className="fx-eyebrow mt-1 block text-muted">
														Derived · not reported by the issuer
													</span>
												) : null}
											</th>

											<td className="px-4 py-4 text-right font-mono text-sm text-muted tabular-nums">
												{row.underwritten}
											</td>

											<td
												className={`px-4 py-4 text-right font-mono text-sm tabular-nums ${
													row.drifting ? "text-accent" : "text-muted"
												}`}
											>
												{row.latest}
											</td>

											<td
												className={`px-5 py-4 text-right font-mono text-sm tabular-nums ${
													row.drifting ? "text-accent" : "text-muted"
												}`}
											>
												{row.delta}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<p className="mt-5 text-sm text-pretty text-muted">
						Constructed for illustration — see{" "}
						<a
							href="/disclosures"
							className="text-primary underline underline-offset-4"
						>
							disclosures
						</a>
						. Coverage falling from 0.30× of headroom to 0.02× is the whole
						story, and it is not a number any monthly statement contains.
					</p>
				</div>
			</div>
		</section>
	);
}
