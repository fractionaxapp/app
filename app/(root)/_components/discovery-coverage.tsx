/*
 * The page leads with 167 platforms and never says what that spans, which is
 * the first thing anyone who allocates for a living will want to know.
 *
 * Two breakdowns of the same 167, by asset class and by region, so the totals
 * can be checked against each other and against the headline. Deliberately no
 * named venues: naming them would imply relationships we have not described,
 * and the useful question is coverage shape rather than which logos we can
 * print.
 *
 * The bar is the row's background rather than a rule beneath it. At full width
 * a label on the left and a count on the right leave several hundred pixels of
 * nothing between them; filling that span with the bar turns the gap into the
 * information.
 */

import { SectionBar } from "./ui";

type Slice = { label: string; count: number };

const byAssetClass: Slice[] = [
	{ label: "Private credit", count: 48 },
	{ label: "Commercial real estate", count: 39 },
	{ label: "Trade finance", count: 22 },
	{ label: "Infrastructure", count: 18 },
	{ label: "Treasuries", count: 16 },
	{ label: "Receivables", count: 12 },
	{ label: "Private equity", count: 7 },
	{ label: "Royalties", count: 5 },
];

const byRegion: Slice[] = [
	{ label: "Asia-Pacific", count: 61 },
	{ label: "North America", count: 44 },
	{ label: "Europe", count: 38 },
	{ label: "Latin America", count: 14 },
	{ label: "Middle East & Africa", count: 10 },
];

function Breakdown({ heading, slices }: { heading: string; slices: Slice[] }) {
	const max = Math.max(...slices.map((slice) => slice.count));
	const total = slices.reduce((sum, slice) => sum + slice.count, 0);

	return (
		<div className="bg-surface">
			<div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3.5">
				<p className="fx-eyebrow text-accent">{heading}</p>
				<p className="fx-eyebrow text-muted tabular-nums">{total}</p>
			</div>

			<ul>
				{slices.map((slice) => (
					<li
						key={slice.label}
						className="relative border-b border-border last:border-b-0"
					>
						<span
							aria-hidden
							className="absolute inset-y-0 left-0 bg-muted/10"
							style={{ width: `${(slice.count / max) * 100}%` }}
						/>

						<div className="relative flex items-baseline justify-between gap-6 px-5 py-3">
							<span className="text-sm">{slice.label}</span>
							<span className="font-mono text-sm text-muted tabular-nums">
								{slice.count}
							</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

export function DiscoveryCoverage() {
	return (
		<section className="fx-section fx-bleed">
			<SectionBar
				label="What 167 covers"
				copy="The same platforms cut two ways. Both add to 167, which is the only useful thing to check about a coverage claim."
			/>

			<div className="mt-10 border border-border">
				<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">Platforms under coverage</p>
					<p className="fx-eyebrow text-accent tabular-nums">167</p>
				</div>

				<div className="grid gap-px bg-border lg:grid-cols-2">
					<Breakdown heading="By asset class" slices={byAssetClass} />
					<Breakdown heading="By region" slices={byRegion} />
				</div>
			</div>

			<p className="mt-5 max-w-3xl text-sm text-pretty text-muted">
				Composition from an example run — see{" "}
				<a
					href="/disclosures"
					className="text-primary underline underline-offset-4"
				>
					disclosures
				</a>
				. A platform issuing across several asset classes is counted under its
				primary one, so the two views split the same set rather than
				double-counting it.
			</p>
		</section>
	);
}
