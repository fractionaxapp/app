/*
 * "Read by the model that underwrote it" is the page's third claim, and it is
 * only meaningful if the comparison is against the original parsed fields
 * rather than against last quarter. These are the same values the Underwrite
 * page extracts from the offering memo.
 *
 * Covenant headroom is the row that matters and it is derived, not reported:
 * the distance between actual coverage and the floor the document sets. No
 * issuer publishes it, because no issuer wants to.
 *
 * The track is what the width is for. A field name is short, so at full width
 * the first column was several hundred pixels of nothing before the numbers
 * started. Filling it with the movement turns dead space into the argument:
 * DSCR still stands at 84% of where it began, and headroom at 7%. That gap is
 * the story, and it is not visible in two columns of figures.
 */

import { SectionBar } from "./ui";

type Row = {
	field: string;
	underwritten: string;
	latest: string;
	delta: string;
	/** Latest as a proportion of the underwritten value. Omitted when the field is not a quantity. */
	ratio?: number;
	derived?: boolean;
};

const rows: Row[] = [
	{
		field: "DSCR",
		underwritten: "1.80×",
		latest: "1.52×",
		delta: "−0.28",
		ratio: 1.52 / 1.8,
	},
	{
		field: "Covenant headroom",
		underwritten: "0.30×",
		latest: "0.02×",
		delta: "−0.28",
		ratio: 0.02 / 0.3,
		derived: true,
	},
	{
		field: "Coupon timeliness",
		underwritten: "On time",
		latest: "3 days late",
		delta: "—",
	},
	{
		field: "Net yield",
		underwritten: "9.2%",
		latest: "9.2%",
		delta: "—",
		ratio: 1,
	},
	{
		field: "Seniority",
		underwritten: "Senior secured",
		latest: "Senior secured",
		delta: "—",
	},
];

export function MonitorDrift() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<SectionBar
				label="Against the original"
				copy="Compared with what the offering memo said, not with last quarter. Same fields, same parse, eleven months apart."
			/>

			<div className="mt-10 min-w-0 border border-border">
				<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">Field drift</p>
					<p className="fx-eyebrow text-accent">3 of 5 moved</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-180 table-fixed border-collapse text-left">
						<colgroup>
							<col className="w-[18rem]" />
							<col />
							<col className="w-[10rem]" />
							<col className="w-[10rem]" />
							<col className="w-[6rem]" />
						</colgroup>

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
									className="fx-eyebrow border-b border-border px-4 py-3 font-normal text-muted"
								>
									Where it stands
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
							{rows.map((row) => {
								const moved =
									row.delta !== "—" || row.latest !== row.underwritten;

								return (
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

										<td className="px-4 py-4">
											{row.ratio === undefined ? (
												<span className="fx-eyebrow text-muted">
													Not a quantity
												</span>
											) : (
												<span className="flex items-center gap-3">
													{/* Track is the underwritten value; the fill is
													    where it stands today. */}
													<span className="relative h-1.5 flex-1 bg-border">
														<span
															className={`absolute inset-y-0 left-0 ${
																moved ? "bg-accent" : "bg-primary"
															}`}
															style={{ width: `${row.ratio * 100}%` }}
														/>
													</span>
													<span
														className={`fx-eyebrow w-10 shrink-0 text-right tabular-nums ${
															moved ? "text-accent" : "text-muted"
														}`}
													>
														{Math.round(row.ratio * 100)}%
													</span>
												</span>
											)}
										</td>

										<td className="px-4 py-4 text-right font-mono text-sm text-muted tabular-nums">
											{row.underwritten}
										</td>

										<td
											className={`px-4 py-4 text-right font-mono text-sm tabular-nums ${
												moved ? "text-accent" : "text-muted"
											}`}
										>
											{row.latest}
										</td>

										<td
											className={`px-5 py-4 text-right font-mono text-sm tabular-nums ${
												moved ? "text-accent" : "text-muted"
											}`}
										>
											{row.delta}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			<p className="mt-5 max-w-4xl text-sm text-pretty text-muted">
				Constructed for illustration — see{" "}
				<a
					href="/disclosures"
					className="text-primary underline underline-offset-4"
				>
					disclosures
				</a>
				. Coverage still stands at 84% of where it began; the headroom above the
				covenant floor stands at 7%. That difference is the whole story, and it
				is not a number any monthly statement contains.
			</p>
		</section>
	);
}
