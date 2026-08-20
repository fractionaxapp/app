import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isAiConfigured } from "@/lib/ai";
import { isDatabaseEnabled } from "@/lib/db/client";
import {
	browseOfferings,
	listMandates,
	offeringFacets,
	offeringStats,
} from "@/lib/db/sourcing";
import { findUserByPrivyDid } from "@/lib/db/users";
import { runMandate, type Match } from "@/lib/sourcing/match";
import type { Criteria, Mandate } from "@/lib/sourcing/types";

import { Panel } from "../../_components/panel";

import { dropMandate } from "./actions";
import { MandateForm } from "./mandate-form";
import {
	OfferingTable,
	PAGE_SIZES,
	type Filters,
} from "../../_components/offering-table";

export const metadata: Metadata = { title: "Sourcing" };

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

const meta = "font-mono text-xs tracking-wide text-muted";

/*
 * Offerings loaded for one match run. Matching happens here rather than in SQL
 * so that a single set of rules produces both the verdict and its reason, and
 * that means the index has to fit in memory for the length of a request.
 *
 * If the index ever outgrows this the screen says so. A mandate quietly run
 * against three quarters of the index is worse than one that admits it.
 */
const CONSIDERED = 5000;

/* The criteria, said back in the same words a person would use. */
function describe(criteria: Criteria): string[] {
	const parts: string[] = [];

	if (criteria.minYield !== undefined)
		parts.push(`≥ ${criteria.minYield}% net`);
	if (criteria.maxYield !== undefined)
		parts.push(`≤ ${criteria.maxYield}% net`);
	if (criteria.minTermMonths !== undefined)
		parts.push(`≥ ${criteria.minTermMonths} months`);
	if (criteria.maxTermMonths !== undefined)
		parts.push(`≤ ${criteria.maxTermMonths} months`);
	if (criteria.maxMinimum !== undefined)
		parts.push(`minimum ≤ ${criteria.maxMinimum.toLocaleString("en-GB")}`);
	if (criteria.minDscr !== undefined) parts.push(`DSCR ≥ ${criteria.minDscr}×`);
	if (criteria.assetClasses) parts.push(criteria.assetClasses.join(" / "));
	if (criteria.seniority) parts.push(criteria.seniority.join(" / "));
	if (criteria.jurisdictions) parts.push(criteria.jurisdictions.join(" / "));
	if (criteria.currencies) parts.push(criteria.currencies.join(" / "));
	if (criteria.exclude) parts.push(`not: ${criteria.exclude.join(", ")}`);

	return parts;
}

/*
 * Sorts offered on this screen.
 *
 * "Best fit" is the default and is the reason this screen exists: matches,
 * then the ones nobody can verify, then the exclusions, each ranked by yield.
 * The rest are the same orderings discover offers, for when the question is
 * about the deals rather than about the mandate.
 */
const SORTS = [
	{ key: "fit", label: "Best fit" },
	{ key: "yield", label: "Highest yield" },
	{ key: "minimum", label: "Smallest minimum" },
	{ key: "minimum-desc", label: "Largest minimum" },
	{ key: "aum", label: "Largest AUM" },
	{ key: "holders", label: "Most holders" },
	{ key: "name", label: "Name" },
];

const RANK: Record<string, number> = {
	match: 0,
	unverifiable: 1,
	excluded: 2,
};

function figure(value: string | null) {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

/*
 * Nulls last in every ordering. An offering that publishes no minimum has not
 * got the smallest one, and floating it to the top of "smallest minimum" would
 * be a lie told by a null — the same rule the discover query follows in SQL.
 */
function by(
	pick: (match: Match) => number | null,
	direction: 1 | -1 = -1,
): (a: Match, b: Match) => number {
	return (a, b) => {
		const left = pick(a);
		const right = pick(b);

		if (left === null && right === null) return 0;
		if (left === null) return 1;
		if (right === null) return -1;

		return (left - right) * direction;
	};
}

function comparator(sort: string): (a: Match, b: Match) => number {
	const yieldOrder = by((m) => figure(m.offering.net_yield));

	switch (sort) {
		case "yield":
			return yieldOrder;
		case "minimum":
			return by((m) => figure(m.offering.minimum), 1);
		case "minimum-desc":
			return by((m) => figure(m.offering.minimum));
		case "aum":
			return by((m) => figure(m.offering.aum));
		case "holders":
			return by((m) => m.offering.holders_count);
		case "name":
			return (a, b) => a.offering.title.localeCompare(b.offering.title);
		default:
			// Best fit: verdict first, then yield inside each group.
			return (a, b) => RANK[a.status] - RANK[b.status] || yieldOrder(a, b);
	}
}

/* Attribution, in the words a person would use for each. */
const readBy: Record<string, string> = {
	claude: "Claude",
	minimax: "MiniMax",
	rules: "the built-in parser",
};

/*
 * Deal sourcing.
 *
 * The index is whatever the crawler has actually found, and when it has found
 * nothing this screen says so rather than showing a demonstration. An empty
 * index is a true statement about the product today; a populated-looking one
 * would not be.
 */
export default async function SourcingPage({
	searchParams,
}: {
	searchParams: Promise<{
		mandate?: string;
		verdict?: string;
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
				<Panel title="Sourcing">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is no index to search.
					</p>
				</Panel>
			</div>
		);
	}

	const user = await findUserByPrivyDid(access.did);
	if (!user) redirect("/dashboard");

	const [stats, facets, mandates, params] = await Promise.all([
		offeringStats(),
		offeringFacets(),
		listMandates(user.id),
		searchParams,
	]);

	const selected: Mandate | undefined =
		mandates.find((mandate) => mandate.id === params.mandate) ?? mandates[0];

	const filters: Filters = {
		verdict: params.verdict ?? "all",
		assetClass: params.class ?? "",
		jurisdiction: params.place ?? "",
		currency: params.ccy ?? "",
		network: params.chain ?? "",
		q: (params.q ?? "").slice(0, 100),
		sort: SORTS.some((entry) => entry.key === params.sort)
			? (params.sort as string)
			: "fit",
		page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
		perPage: PAGE_SIZES.includes(Number(params.per))
			? Number(params.per)
			: PAGE_SIZES[0],
	};

	/*
	 * The filters that are pure predicates go to Postgres; only the verdict has
	 * to wait for the matcher. That matters for the ceiling below: narrowing to
	 * one jurisdiction usually leaves a set small enough that nothing is left
	 * out at all.
	 */
	const found = selected
		? await browseOfferings({
				assetClass: filters.assetClass,
				jurisdiction: filters.jurisdiction,
				currency: filters.currency,
				network: filters.network,
				q: filters.q,
				sort: "recent",
				limit: CONSIDERED,
			})
		: { rows: [], total: 0 };

	const results = selected ? runMandate(found.rows, selected.criteria) : null;

	// True when more offerings match the filters than one run can hold.
	const truncated = found.total > found.rows.length;

	/*
	 * One list, ordered so the verdict is the first thing that separates rows
	 * rather than the only way to find them: matches first, then the ones
	 * nobody can verify, then the exclusions, each already ranked by yield.
	 */
	const everything: Match[] = results
		? [...results.matched, ...results.unverifiable, ...results.excluded]
		: [];

	const shown = everything
		.filter(
			(match) => filters.verdict === "all" || match.status === filters.verdict,
		)
		.sort(comparator(filters.sort));

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
						No venue has been crawled yet, so there is nothing to match a
						mandate against. Venues are added under Administration → Sources;
						until one is, this screen has nothing true to show and will not
						invent anything.
					</p>
				</Panel>
			) : null}

			<Panel
				title="Your mandates"
				status={
					<span className="text-muted">
						{mandates.length === 0 ? "None yet" : `${mandates.length} saved`}
					</span>
				}
			>
				<MandateForm aiEnabled={isAiConfigured()} />

				{mandates.length > 0 ? (
					<ul className="border-t border-border">
						{mandates.map((mandate) => {
							const isSelected = mandate.id === selected?.id;

							return (
								<li
									key={mandate.id}
									className={`border-b border-border px-5 py-4 last:border-b-0 ${
										isSelected ? "bg-surface-muted" : ""
									}`}
								>
									<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
										<Link
											href={`/dashboard/sourcing?mandate=${mandate.id}`}
											className="min-w-0 text-sm text-pretty hover:text-primary"
										>
											{mandate.statement}
										</Link>

										<form action={dropMandate}>
											<input type="hidden" name="id" value={mandate.id} />
											<button
												type="submit"
												className="fx-eyebrow cursor-pointer text-muted transition-colors hover:text-danger"
											>
												Remove
											</button>
										</form>
									</div>

									<p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
										{describe(mandate.criteria).map((part) => (
											<span
												key={part}
												className="fx-eyebrow border border-border px-2 py-1 text-muted"
											>
												{part}
											</span>
										))}
									</p>

									<p className={`mt-2 ${meta}`}>
										{stamp.format(mandate.created_at)} · read by{" "}
										{readBy[mandate.parsed_by] ?? mandate.parsed_by}
									</p>
								</li>
							);
						})}
					</ul>
				) : null}
			</Panel>

			{truncated ? (
				<p className="border border-danger/40 bg-surface px-5 py-4 text-sm text-pretty text-accent">
					{found.total.toLocaleString("en-GB")} offerings match these filters
					and the mandate was run against the{" "}
					{found.rows.length.toLocaleString("en-GB")} most recently seen. The
					rest were not considered — narrow the filters, or say so before acting
					on the result.
				</p>
			) : null}

			{results && stats.live > 0 ? (
				<OfferingTable
					title="Sourced deals"
					rows={shown.slice(
						(Math.max(1, filters.page) - 1) * filters.perPage,
						Math.max(1, filters.page) * filters.perPage,
					)}
					total={shown.length}
					filters={filters}
					path="/dashboard/sourcing"
					keep={{ mandate: selected?.id ?? "" }}
					showVerdict
					sorts={SORTS}
					options={facets}
					empty="Nothing matches those filters. Widen them, or clear them to see the whole index against this mandate."
				/>
			) : null}
		</div>
	);
}
