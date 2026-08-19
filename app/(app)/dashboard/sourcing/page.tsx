import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isAiConfigured } from "@/lib/ai";
import { isDatabaseEnabled } from "@/lib/db/client";
import {
	listLiveOfferings,
	listMandates,
	offeringStats,
} from "@/lib/db/sourcing";
import { findUserByPrivyDid } from "@/lib/db/users";
import { runMandate, type Match } from "@/lib/sourcing/match";
import type { Criteria, Mandate } from "@/lib/sourcing/types";

import { Panel } from "../../_components/panel";

import { dropMandate } from "./actions";
import { MandateForm } from "./mandate-form";

export const metadata: Metadata = { title: "Sourcing" };

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

const meta = "font-mono text-xs tracking-wide text-muted";

/*
 * Rows rendered per group. A real index is thousands of offerings, and putting
 * all of them in one document is megabytes of HTML nobody scrolls. The count
 * in the header is the true total and the footer says what was left out —
 * a cap you cannot see reads as "this is everything".
 */
const PER_GROUP = 25;

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

const tone = {
	pass: "text-primary",
	fail: "text-danger",
	unknown: "text-accent",
} as const;

function Result({ match }: { match: Match }) {
	const offering = match.offering;

	return (
		<li className="border-b border-border px-5 py-4 last:border-b-0">
			<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
				<p className="min-w-0 text-sm font-semibold">
					{offering.url ? (
						<a
							href={offering.url}
							target="_blank"
							rel="noopener noreferrer"
							className="underline underline-offset-4 hover:text-primary"
						>
							{offering.title}
						</a>
					) : (
						offering.title
					)}
				</p>

				<p className={meta}>
					{offering.source_label}
					{offering.issuer ? ` · ${offering.issuer}` : ""}
				</p>
			</div>

			<ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
				{match.checks.map((check) => (
					<li
						key={check.label}
						className="fx-eyebrow flex items-baseline gap-2"
					>
						<span className="text-muted">{check.label}</span>
						<span className={tone[check.verdict]}>{check.detail}</span>
					</li>
				))}
			</ul>
		</li>
	);
}

function Group({
	title,
	note,
	matches,
}: {
	title: string;
	note: string;
	matches: Match[];
}) {
	if (matches.length === 0) return null;

	return (
		<Panel
			title={title}
			status={<span className="text-muted">{matches.length}</span>}
		>
			<p className="border-b border-border px-5 py-3 text-sm text-pretty text-muted">
				{note}
			</p>
			<ul>
				{matches.slice(0, PER_GROUP).map((match) => (
					<Result key={match.offering.id} match={match} />
				))}
			</ul>

			{matches.length > PER_GROUP ? (
				<p className="border-t border-border px-5 py-3 text-sm text-muted">
					Showing {PER_GROUP} of {matches.length}. Narrow the mandate to see the
					rest — a list this long usually means a criterion is missing rather
					than that the market is this wide.
				</p>
			) : null}
		</Panel>
	);
}

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
	searchParams: Promise<{ mandate?: string }>;
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

	const [stats, mandates, params] = await Promise.all([
		offeringStats(),
		listMandates(user.id),
		searchParams,
	]);

	const selected: Mandate | undefined =
		mandates.find((mandate) => mandate.id === params.mandate) ?? mandates[0];

	const results = selected
		? runMandate(await listLiveOfferings(), selected.criteria)
		: null;

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
							{metric.value}
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
										{mandate.parsed_by === "claude"
											? "the model"
											: "the built-in parser"}
									</p>
								</li>
							);
						})}
					</ul>
				) : null}
			</Panel>

			{results && stats.live > 0 ? (
				<>
					<Group
						title="Matches"
						note="Meets every criterion the mandate states."
						matches={results.matched}
					/>

					<Group
						title="Cannot verify"
						note="Nothing here fails the mandate — the venue simply does not publish a field it asks about. These are the ones worth a phone call."
						matches={results.unverifiable}
					/>

					<Group
						title="Excluded"
						note="Shown with the reason, so a mandate that is filtering out everything is visible as such rather than looking like an empty market."
						matches={results.excluded}
					/>

					{results.matched.length === 0 &&
					results.unverifiable.length === 0 &&
					results.excluded.length === 0 ? (
						<Panel title="No results">
							<p className="px-5 py-6 text-pretty text-muted">
								The index has offerings, but none of them were even considered
								against this mandate. That usually means the crawl stored titles
								without terms — check Sources for what the last run actually
								parsed.
							</p>
						</Panel>
					) : null}
				</>
			) : null}
		</div>
	);
}
