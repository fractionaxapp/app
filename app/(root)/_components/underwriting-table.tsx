/*
 * The other half of the claim. Extraction is only worth anything if the
 * extracted fields line up across issuers, so this shows three deals from three
 * venues in one grid — which is the thing you cannot do with three PDFs.
 *
 * A real table element, not a grid of divs: it is tabular data, and the header
 * association matters to anyone reading it with assistive tech.
 */

import { SectionBar } from "./ui";

const columns = [
	{ key: "net", label: "Net", align: "right" },
	{ key: "dscr", label: "DSCR", align: "right" },
	{ key: "term", label: "Term", align: "right" },
	{ key: "seniority", label: "Seniority", align: "left" },
	{ key: "minimum", label: "Minimum", align: "right" },
] as const;

const deals = [
	{
		name: "Receivables pool VII",
		origin: "SG · Trade finance",
		net: "9.2%",
		dscr: "1.80×",
		term: "24 mo",
		seniority: "Senior secured",
		minimum: "$10,000",
		flags: 1,
	},
	{
		name: "Jakarta logistics II",
		origin: "ID · Commercial real estate",
		net: "8.6%",
		dscr: "1.50×",
		term: "36 mo",
		seniority: "Senior",
		minimum: "$25,000",
		flags: 0,
	},
	{
		name: "SME bridge facility",
		origin: "VN · Private credit",
		net: "8.1%",
		dscr: "1.60×",
		term: "18 mo",
		seniority: "Mezzanine",
		minimum: "$15,000",
		flags: 2,
	},
];

export function UnderwritingTable() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<SectionBar
				label="What comes out"
				copy="Three issuers, three document formats, one grid. Sorting by yield is only meaningful once every row means the same thing."
			/>

			{/*
			 * min-w-0 is load-bearing even at full width: without it a grid or flex
			 * child refuses to shrink below the table's min-width, overflow-x-auto
			 * never engages, and the page scrolls sideways on a phone.
			 */}
			<div className="mt-10 min-w-0">
				<div className="border border-border">
					<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
						<p className="fx-eyebrow text-muted">
							Example shortlist · 3 of 37 matches
						</p>
						<p className="fx-eyebrow text-accent">Sorted by net yield</p>
					</div>

					{/* Scrolls inside its own box rather than widening the page. */}
					<div className="overflow-x-auto">
						<table className="w-full min-w-160 border-collapse text-left">
							<thead>
								<tr>
									<th
										scope="col"
										className="fx-eyebrow border-b border-border px-5 py-3 font-normal text-muted"
									>
										Deal
									</th>
									{columns.map((column) => (
										<th
											key={column.key}
											scope="col"
											className={`fx-eyebrow border-b border-border px-4 py-3 font-normal text-muted ${
												column.align === "right" ? "text-right" : "text-left"
											}`}
										>
											{column.label}
										</th>
									))}
									<th
										scope="col"
										className="fx-eyebrow border-b border-border px-5 py-3 text-right font-normal text-muted"
									>
										Flags
									</th>
								</tr>
							</thead>

							<tbody>
								{deals.map((deal) => (
									<tr
										key={deal.name}
										className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-muted"
									>
										<th scope="row" className="px-5 py-4 font-normal">
											<span className="block text-sm font-semibold">
												{deal.name}
											</span>
											<span className="fx-eyebrow mt-1 block text-muted">
												{deal.origin}
											</span>
										</th>

										{columns.map((column) => (
											<td
												key={column.key}
												className={`px-4 py-4 font-mono text-sm tabular-nums ${
													column.align === "right" ? "text-right" : "text-left"
												}`}
											>
												{deal[column.key]}
											</td>
										))}

										<td className="px-5 py-4 text-right">
											{deal.flags === 0 ? (
												<span className="font-mono text-sm text-muted">—</span>
											) : (
												<span className="fx-eyebrow inline-flex items-center gap-2 border border-accent/40 px-2 py-1 text-accent">
													<span aria-hidden className="size-1 bg-accent" />
													{deal.flags}
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<p className="mt-5 text-sm text-muted">
					Constructed for illustration — see{" "}
					<a
						href="/disclosures"
						className="text-primary underline underline-offset-4"
					>
						disclosures
					</a>
					. The point is the shape of the output, not these numbers.
				</p>
			</div>
		</section>
	);
}
