import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import {
	browseOfferings,
	offeringFacets,
	offeringStats,
	SORT_KEYS,
} from "@/lib/db/sourcing";

import {
	OfferingTable,
	PAGE_SIZES,
	type Filters,
	type Row,
} from "../../_components/offering-table";
import { Panel } from "../../_components/panel";

export const metadata: Metadata = { title: "Discover" };

const sorts = [
	{ key: "recent", label: "Recently seen" },
	{ key: "minimum", label: "Smallest minimum" },
	{ key: "minimum-desc", label: "Largest minimum" },
	{ key: "aum", label: "Largest AUM" },
	{ key: "holders", label: "Most holders" },
	{ key: "return-12m", label: "Best 12-month return" },
	{ key: "name", label: "Name" },
];

/*
 * The index, browsable.
 *
 * Sourcing answers "what fits this mandate"; this answers "what is there",
 * which is the question people actually have first and the one the product had
 * no screen for — you had to write a mandate before you could see whether the
 * index held anything worth writing one about.
 *
 * Filtered, sorted and paged in Postgres rather than in the request. There is
 * no per-row reasoning to compute here, so none of the index has to be held in
 * memory and the cap the sourcing screen lives with does not apply: this
 * really is everything indexed.
 */
export default async function DiscoverPage({
	searchParams,
}: {
	searchParams: Promise<{
		class?: string;
		place?: string;
		ccy?: string;
		chain?: string;
		q?: string;
		sort?: string;
		page?: string;
		per?: string;
	}>;
}) {
	const access = await getAccess();

	if (access.state === "signed-out") return null;
	if (access.state === "waiting") redirect("/dashboard");

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Discover">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is no index to browse.
					</p>
				</Panel>
			</div>
		);
	}

	const params = await searchParams;

	const filters: Filters = {
		verdict: "all",
		assetClass: params.class ?? "",
		jurisdiction: params.place ?? "",
		currency: params.ccy ?? "",
		network: params.chain ?? "",
		q: (params.q ?? "").slice(0, 100),
		sort: SORT_KEYS.includes(params.sort ?? "")
			? (params.sort as string)
			: "recent",
		page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
		perPage: PAGE_SIZES.includes(Number(params.per))
			? Number(params.per)
			: PAGE_SIZES[0],
	};

	const [stats, facets] = await Promise.all([
		offeringStats(),
		offeringFacets(),
	]);

	const { rows, total } = await browseOfferings({
		assetClass: filters.assetClass,
		jurisdiction: filters.jurisdiction,
		currency: filters.currency,
		network: filters.network,
		q: filters.q,
		sort: filters.sort,
		limit: filters.perPage,
		offset: (filters.page - 1) * filters.perPage,
	});

	/*
	 * The table renders verdicts when it has them. Browsing has none: nothing
	 * has been asked of these offerings, so nothing has passed or failed.
	 */
	const asRows: Row[] = rows.map((offering) => ({
		offering,
		checks: [],
		status: "match",
	}));

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-3">
				{[
					{ label: "Offerings indexed", value: stats.live },
					{ label: "Venues represented", value: stats.venues },
					{ label: "Withdrawn", value: stats.withdrawn },
				].map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p className="mt-3 font-mono text-3xl leading-none font-medium tracking-tight text-accent tabular-nums">
							{metric.value.toLocaleString("en-GB")}
						</p>
					</article>
				))}
			</section>

			{stats.live === 0 ? (
				<Panel title="The index is empty">
					<p className="px-5 py-6 text-pretty text-muted">
						No venue has been crawled yet, so there is nothing to browse. Venues
						are added under Administration → Sources; until one is, this screen
						has nothing true to show and will not invent anything.
					</p>
				</Panel>
			) : (
				<OfferingTable
					title="Everything indexed"
					rows={asRows}
					total={total}
					filters={filters}
					path="/dashboard/discover"
					showVerdict={false}
					sorts={sorts}
					options={facets}
					empty="Nothing indexed matches those filters. Widen them, or clear them to see everything."
				/>
			)}

			<p className="px-1 text-sm text-pretty text-muted">
				Browsing shows what venues publish, as they publish it. To ask whether
				something fits what you are looking for — and to see the reason either
				way —{" "}
				<Link
					href="/dashboard/sourcing"
					className="text-primary underline underline-offset-4"
				>
					write a mandate
				</Link>
				.
			</p>
		</div>
	);
}
