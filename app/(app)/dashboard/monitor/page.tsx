import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import { changesFor, listFollowed, type Change } from "@/lib/db/monitor";
import { findUserByPrivyDid } from "@/lib/db/users";

import { Artwork } from "../../_components/artwork";
import { SessionExpired } from "../../_components/session-expired";
import { Panel } from "../../_components/panel";

export const metadata: Metadata = { title: "Monitor" };

const meta = "font-mono text-xs tracking-wide text-muted";

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

/** Days without a sighting before a listing is worth questioning. */
const STALE_AFTER = 14;

/** Field names as a person would say them. */
const FIELDS: Record<string, string> = {
	net_yield: "Net yield",
	term_months: "Term",
	seniority: "Seniority",
	dscr: "Coverage",
	minimum: "Minimum",
	currency: "Currency",
	jurisdiction: "Jurisdiction",
	asset_class: "Asset class",
	fund_structure: "Legal form",
	redemption_frequency: "Redemptions",
	investor_types: "Eligibility",
	management_fee: "Management fee",
	performance_fee: "Performance fee",
	url: "Link",
	title: "Name",
	withdrawn_at: "Listing",
	aum: "Assets",
	holders_count: "Holders",
};

/*
 * Changes that alter what was bought, as against changes that are simply news.
 * A minimum moving does not affect a position already taken; a coupon or a
 * covenant does.
 */
const MATERIAL = new Set([
	"net_yield",
	"term_months",
	"seniority",
	"dscr",
	"currency",
	"withdrawn_at",
	"investor_types",
	"management_fee",
	"performance_fee",
]);

function value(field: string, raw: string | null) {
	if (raw === null) return "not published";
	if (field === "withdrawn_at") return "withdrawn";
	if (field === "term_months") return `${raw} months`;

	const parsed = Number.parseFloat(raw);

	return Number.isFinite(parsed) && /^-?[\d.]+$/.test(raw)
		? parsed.toLocaleString("en-GB")
		: raw;
}

function ChangeLine({ change }: { change: Change }) {
	const material = MATERIAL.has(change.field);

	return (
		<li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<span
				aria-hidden
				className={`size-1.5 shrink-0 translate-y-[-1px] ${
					material ? "bg-danger" : "bg-accent"
				}`}
			/>
			<span className="fx-eyebrow text-muted">
				{FIELDS[change.field] ?? change.field}
			</span>
			<span className="font-mono text-sm">
				<span className="text-muted/70">
					{value(change.field, change.before)}
				</span>
				<span className="mx-2 text-muted/50">→</span>
				<span className={material ? "text-danger" : "text-accent"}>
					{value(change.field, change.after)}
				</span>
			</span>
			<span className={meta}>{stamp.format(change.changed_at)}</span>
		</li>
	);
}

/*
 * Monitor.
 *
 * The one stage that cannot be built the day the product ships, because it
 * needs a before as well as an after. The crawler overwrites, so a trigger
 * records what moved (0012_offering_changes.sql) and this reads it back
 * against the day each position was taken.
 *
 * It watches two things: what money is committed to, and what underwriting set
 * aside to watch — the second being where a deal sits precisely because
 * something about it needed checking later.
 *
 * What it cannot do is watch the things that matter most in private credit —
 * distributions arriving, covenants holding — because no venue here publishes
 * them. It says so rather than implying the quiet is good news.
 */
export default async function MonitorPage() {
	const access = await getAccess();

	// The browser thinks it is signed in and this server disagrees; say so
	// rather than rendering an empty page inside working chrome.
	if (access.state === "signed-out") return <SessionExpired />;
	if (access.state === "waiting") redirect("/dashboard");

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Monitor">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is nothing to watch.
					</p>
				</Panel>
			</div>
		);
	}

	const user = await findUserByPrivyDid(access.did);
	if (!user) redirect("/dashboard");

	const followed = await listFollowed(user.id);
	const changes = await changesFor(followed.map((item) => item.id));

	const byOffering = new Map<string, Change[]>();

	for (const change of changes) {
		const list = byOffering.get(change.offering_id) ?? [];
		list.push(change);
		byOffering.set(change.offering_id, list);
	}

	const rows = followed.map((item) => {
		// Only what moved after the position was taken. Everything earlier is
		// the deal as it was bought, not a change to it.
		const since = (byOffering.get(item.id) ?? []).filter(
			(change) => change.changed_at.getTime() >= item.since.getTime(),
		);

		return {
			item,
			since,
			material: since.filter((change) => MATERIAL.has(change.field)),
			stale:
				!item.withdrawn_at && item.days_unseen >= STALE_AFTER
					? item.days_unseen
					: null,
		};
	});

	const positions = rows.filter((row) => row.item.kind === "allocation");
	const watching = rows.filter((row) => row.item.kind === "watchlist");
	const withdrawn = rows.filter((row) => row.item.withdrawn_at);
	const moved = rows.filter((row) => row.material.length > 0);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-4">
				{[
					{ label: "Positions", value: positions.length, tone: "text-primary" },
					{ label: "Watching", value: watching.length, tone: "text-accent" },
					{
						label: "Changed under you",
						value: moved.length,
						tone: moved.length > 0 ? "text-danger" : "text-muted",
					},
					{
						label: "Withdrawn",
						value: withdrawn.length,
						tone: withdrawn.length > 0 ? "text-danger" : "text-muted",
					},
				].map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p
							className={`mt-3 font-mono text-3xl leading-none font-medium tracking-tight tabular-nums ${metric.tone}`}
						>
							{metric.value.toLocaleString("en-GB")}
						</p>
					</article>
				))}
			</section>

			<p className="px-1 text-sm text-pretty text-muted">
				What has moved since you took a position, or set one aside to watch —
				compared against the offering as it stood that day, not against last
				week. Distributions and covenant tests are not here: no venue in this
				index publishes them, and quiet from a venue is not the same as nothing
				happening.
			</p>

			{rows.length === 0 ? (
				<Panel title="Nothing followed yet">
					<p className="px-5 py-6 text-pretty text-muted">
						An offering arrives here once you allocate to it, or set it to watch
						at{" "}
						<Link
							href="/dashboard/underwrite"
							className="text-primary underline underline-offset-4"
						>
							underwriting
						</Link>
						.
					</p>
				</Panel>
			) : (
				<Panel
					title="Followed"
					status={
						<span className="text-muted">
							{positions.length} held · {watching.length} watched
						</span>
					}
				>
					<ul>
						{rows.map(({ item, since, material, stale }) => (
							<li
								key={`${item.kind}-${item.id}`}
								className="border-b border-border px-5 py-5 last:border-b-0"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
									<p className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
										{item.icon_url ? (
											<Artwork src={item.icon_url} alt="" size={16} />
										) : null}
										<Link
											href={`/dashboard/offerings/${item.id}`}
											className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline"
										>
											{item.title}
										</Link>
										<span
											className={`fx-eyebrow ${
												item.kind === "allocation"
													? "text-primary"
													: "text-accent"
											}`}
										>
											{item.kind === "allocation"
												? (item.status ?? "allocated")
												: "watching"}
										</span>
										{item.withdrawn_at ? (
											<span className="fx-eyebrow text-danger">
												withdrawn at the venue
											</span>
										) : null}
									</p>

									<p className={meta}>
										{item.amount
											? `${Number.parseFloat(item.amount).toLocaleString("en-GB")}${
													item.allocation_currency
														? ` ${item.allocation_currency}`
														: ""
												} · `
											: ""}
										since {stamp.format(item.since)}
									</p>
								</div>

								{since.length > 0 ? (
									<ul className="mt-3 flex flex-col gap-2">
										{since.slice(0, 8).map((change, index) => (
											<ChangeLine key={index} change={change} />
										))}
										{since.length > 8 ? (
											<li className={meta}>
												and {since.length - 8} more, on its record
											</li>
										) : null}
									</ul>
								) : (
									<p className={`mt-3 ${meta}`}>
										Nothing has changed since. Last seen{" "}
										{stamp.format(item.last_seen)}.
									</p>
								)}

								{stale ? (
									<p className="mt-3 text-sm text-accent">
										Not seen for {stale} days — the venue may have stopped
										listing it, or the crawl may not be running.
									</p>
								) : null}

								{material.length > 0 ? (
									<p className="mt-3 text-sm text-pretty text-danger">
										{material.length === 1
											? "One thing that defines this position has moved."
											: `${material.length} things that define this position have moved.`}{" "}
										<span className="text-muted">
											Re-underwriting it against what is published now is the
											honest next step.
										</span>
									</p>
								) : null}
							</li>
						))}
					</ul>
				</Panel>
			)}

			<p className="px-1 text-sm text-pretty text-muted">
				Changes are recorded whenever a crawl finds a field different from the
				one stored. Assets and holders are only recorded when they move by more
				than a twentieth, since both drift constantly and burying a coupon
				change under them would defeat the point.
			</p>
		</div>
	);
}
