import Link from "next/link";

import type { Match, Status } from "@/lib/sourcing/match";
import type { Offering } from "@/lib/sourcing/types";

import { Panel } from "./panel";

/*
 * The offerings table, shared by the two screens that show offerings.
 *
 * Sourcing runs a mandate and needs a verdict on every row; discover is
 * browsing and has none. They are otherwise the same thing — the same columns,
 * the same filters, the same expanded row — so they are the same component
 * with the verdict switched off rather than two tables that drift apart.
 *
 * Rows arrive already paged. Sourcing slices in memory because it had to load
 * the index to match against it; discover pages in SQL because it did not.
 *
 * Every row is a <details>. The accordion is the platform's, not ours — it
 * opens without JavaScript, it is keyboard operable and screen readers
 * announce it, and the summary keeps the same grid as the header above it so
 * an expanded row does not break the columns.
 */

export type Filters = {
	verdict: string;
	assetClass: string;
	jurisdiction: string;
	currency: string;
	network: string;
	q: string;
	sort: string;
	page: number;
	perPage: number;
};

/** Offered page sizes. Ten by default: a screenful, not a scroll. */
export const PAGE_SIZES = [10, 25, 50, 100];

export type Row = {
	offering: Offering;
	checks: Match["checks"];
	status: Status;
};

const verdicts = [
	{ key: "all", label: "All" },
	{ key: "match", label: "Matches" },
	{ key: "unverifiable", label: "Cannot verify" },
	{ key: "excluded", label: "Excluded" },
] as const;

const statusLabel: Record<Status, string> = {
	match: "Match",
	unverifiable: "Cannot verify",
	excluded: "Excluded",
};

const statusTone: Record<Status, string> = {
	match: "text-primary",
	unverifiable: "text-accent",
	excluded: "text-muted",
};

const checkTone = {
	pass: "text-primary",
	fail: "text-danger",
	unknown: "text-accent",
} as const;

const meta = "font-mono text-xs tracking-wide text-muted";

const COLUMNS =
	"lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_8rem]";

const BROWSE_COLUMNS =
	"lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_7rem]";

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

function num(value: string | null, digits = 0) {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return null;

	return parsed.toLocaleString("en-GB", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
}

/** Big money in the units people say out loud rather than twelve digits. */
function compact(value: string | null) {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return null;

	return parsed.toLocaleString("en-GB", {
		notation: "compact",
		maximumFractionDigits: 1,
	});
}

function href(
	path: string,
	keep: Record<string, string>,
	filters: Filters,
	changes: Partial<Filters>,
) {
	const merged = { ...filters, ...changes };
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(keep)) {
		if (value) params.set(key, value);
	}

	if (merged.verdict !== "all") params.set("verdict", merged.verdict);
	if (merged.assetClass) params.set("class", merged.assetClass);
	if (merged.jurisdiction) params.set("place", merged.jurisdiction);
	if (merged.currency) params.set("ccy", merged.currency);
	if (merged.network) params.set("chain", merged.network);
	if (merged.q) params.set("q", merged.q);
	if (merged.sort && merged.sort !== "recent") params.set("sort", merged.sort);
	if (merged.perPage !== PAGE_SIZES[0])
		params.set("per", String(merged.perPage));
	if (merged.page > 1) params.set("page", String(merged.page));

	const query = params.toString();
	return `${path}${query ? `?${query}` : ""}`;
}

/** One label/value pair in an opened row, skipped entirely when unknown. */
function Detail({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode | null;
}) {
	if (value === null || value === undefined || value === "") return null;

	return (
		<div className="min-w-0">
			<dt className="fx-eyebrow text-muted/70">{label}</dt>
			<dd className="mt-1 font-mono text-sm break-words">{value}</dd>
		</div>
	);
}

/*
 * One row.
 *
 * The shared `name` makes the group exclusive — opening one closes the rest —
 * which browsers without that support simply ignore, leaving independent
 * toggles. Same mechanism as the marketing FAQ.
 *
 * The open row is marked with an inset shadow rather than a border: a real
 * border would shift its contents three pixels out of line with every row
 * above and below it.
 */
function Line({ match, showVerdict }: { match: Row; showVerdict: boolean }) {
	const o: Offering = match.offering;

	return (
		<details
			name="offering"
			className="group border-b border-border last:border-b-0 open:bg-surface-muted/40 open:shadow-[inset_3px_0_0_var(--color-primary)]"
		>
			<summary
				className={`grid cursor-pointer list-none grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-muted [&::-webkit-details-marker]:hidden ${
					showVerdict ? COLUMNS : BROWSE_COLUMNS
				}`}
			>
				<span className="min-w-0 text-sm font-semibold group-open:text-primary">
					<span
						aria-hidden
						className="mr-2 inline-block text-muted transition-transform group-open:rotate-90 group-open:text-primary"
					>
						›
					</span>
					{o.title}
					{o.symbol ? (
						<span className="ml-2 font-mono text-xs font-normal text-muted">
							{o.symbol}
						</span>
					) : null}
				</span>

				<span className={`hidden truncate lg:block ${meta}`}>
					{o.issuer ?? o.platform ?? "—"}
				</span>

				<span className={`hidden truncate lg:block ${meta}`}>
					{o.asset_class ?? "—"}
				</span>

				<span className={`hidden truncate lg:block ${meta}`}>
					{o.jurisdiction ?? "—"}
				</span>

				{/* No minimum means no amount to denominate, so the currency goes
				    with it — "— USDC" reads like a figure that failed to load. */}
				<span className={`hidden lg:block ${meta} text-right tabular-nums`}>
					{num(o.minimum) ?? "—"}
					{num(o.minimum) && o.currency ? (
						<span className="ml-1 opacity-70">{o.currency}</span>
					) : null}
				</span>

				{showVerdict ? (
					<span className={`fx-eyebrow text-right ${statusTone[match.status]}`}>
						{statusLabel[match.status]}
					</span>
				) : null}
			</summary>

			<div className="border-t border-border bg-surface-muted/40 px-5 py-5">
				{/* Why it landed where it did, before anything else. */}
				{match.checks.length > 0 ? (
					<ul className="flex flex-wrap gap-x-6 gap-y-2">
						{match.checks.map((check) => (
							<li
								key={check.label}
								className="fx-eyebrow flex items-baseline gap-2"
							>
								<span className="text-muted">{check.label}</span>
								<span className={checkTone[check.verdict]}>{check.detail}</span>
							</li>
						))}
					</ul>
				) : showVerdict ? (
					<p className="text-sm text-muted">
						This mandate states no criterion that touches this offering.
					</p>
				) : null}

				{o.description ? (
					<p className="mt-4 max-w-3xl text-sm text-pretty text-muted">
						{o.description}
					</p>
				) : null}

				<dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
					<Detail label="Issuer" value={o.issuer} />
					<Detail label="Platform" value={o.platform} />
					<Detail label="Asset class" value={o.asset_class} />
					<Detail label="Jurisdiction" value={o.jurisdiction} />
					<Detail
						label="Minimum"
						value={
							num(o.minimum)
								? `${num(o.minimum)}${o.currency ? ` ${o.currency}` : ""}`
								: null
						}
					/>
					<Detail label="Structure" value={o.fund_structure} />
					<Detail label="Networks" value={o.networks?.join(", ") ?? null} />
					<Detail label="AUM" value={compact(o.aum)} />
					<Detail
						label="Holders"
						value={o.holders_count?.toLocaleString("en-GB")}
					/>
					<Detail label="Subscriptions" value={o.subscription_frequency} />
					<Detail label="Redemptions" value={o.redemption_frequency} />
					<Detail label="Income" value={o.income_treatment} />
					<Detail
						label="Investors"
						value={o.investor_types?.join(", ") ?? null}
					/>
					<Detail label="Inception" value={o.inception} />
					<Detail label="Net yield" value={num(o.net_yield, 2)} />
					<Detail
						label="Term"
						value={o.term_months ? `${o.term_months} months` : null}
					/>
					<Detail label="Seniority" value={o.seniority} />
					<Detail label="DSCR" value={num(o.dscr, 2)} />
				</dl>

				{/*
				 * Kept apart from the fields above and labelled for what it is. A
				 * return with no stated basis is not a yield, and putting it in the
				 * same list would let it be read as one.
				 */}
				{o.reported_return !== null ? (
					<p className="mt-5 border-l-2 border-accent/50 pl-3 text-xs text-pretty text-muted">
						The venue reports a return of{" "}
						<span className="font-mono text-accent">
							{num(o.reported_return, 2)}
						</span>
						with no stated basis — annualised, trailing, or since inception is
						not said. It is kept as published and is not used for matching.
					</p>
				) : null}

				<p
					className={`mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 ${meta}`}
				>
					{/* The row shows what fits a row; the record shows everything,
					    including the venue's untouched payload. */}
					<Link
						href={`/dashboard/offerings/${o.id}`}
						className="font-semibold text-primary underline underline-offset-4"
					>
						Full record →
					</Link>
					<span>{o.source_label}</span>
					<span>first seen {stamp.format(o.first_seen)}</span>
					<span>last seen {stamp.format(o.last_seen)}</span>
					{o.url ? (
						<a
							href={o.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline underline-offset-4"
						>
							Open at the venue
						</a>
					) : null}
				</p>
			</div>
		</details>
	);
}

export function OfferingTable({
	title,
	rows,
	total,
	filters,
	path,
	keep = {},
	showVerdict,
	sorts,
	options,
	empty,
}: {
	title: string;
	rows: Row[];
	total: number;
	filters: Filters;
	path: string;
	keep?: Record<string, string>;
	showVerdict: boolean;
	sorts?: { key: string; label: string }[];
	options: {
		assetClasses: string[];
		jurisdictions: string[];
		currencies: string[];
		networks?: string[];
	};
	empty: string;
}) {
	const perPage = filters.perPage;
	const pages = Math.max(1, Math.ceil(total / perPage));
	const page = Math.min(Math.max(1, filters.page), pages);
	const start = (page - 1) * perPage;

	const select =
		"min-h-9 w-full bg-surface px-2 font-mono text-xs text-foreground outline-none focus:bg-surface-muted";

	const headings = showVerdict
		? [
				"Offering",
				"Issuer",
				"Asset class",
				"Jurisdiction",
				"Minimum",
				"Verdict",
			]
		: ["Offering", "Issuer", "Asset class", "Jurisdiction", "Minimum"];

	return (
		<Panel
			title={title}
			status={
				<span className="text-muted">
					{total.toLocaleString("en-GB")} shown
				</span>
			}
		>
			{showVerdict ? (
				/* Verdict on its own line: it is the coarsest cut and the one people
				   reach for first, so it should not compete with four dropdowns. */
				<div className="border-b border-border px-5 py-3">
					<nav className="inline-flex flex-wrap gap-px bg-border">
						{verdicts.map((entry) => (
							<Link
								key={entry.key}
								href={href(path, keep, filters, {
									verdict: entry.key,
									page: 1,
								})}
								aria-current={
									entry.key === filters.verdict ? "page" : undefined
								}
								className={`fx-eyebrow px-3.5 py-2 transition-colors ${
									entry.key === filters.verdict
										? "bg-surface-muted text-foreground"
										: "bg-surface text-muted hover:text-foreground"
								}`}
							>
								{entry.label}
							</Link>
						))}
					</nav>
				</div>
			) : null}

			{/* GET, so any view of the index is a URL you can send to someone. */}
			<form className="border-b border-border px-5 py-3.5">
				{Object.entries(keep).map(([key, value]) =>
					value ? (
						<input key={key} type="hidden" name={key} value={value} />
					) : null,
				)}

				{filters.verdict !== "all" ? (
					<input type="hidden" name="verdict" value={filters.verdict} />
				) : null}

				<div className="flex flex-wrap items-end gap-x-3 gap-y-3">
					<label className="min-w-36 flex-1">
						<span className="fx-eyebrow text-muted/70">Asset class</span>
						<select
							name="class"
							defaultValue={filters.assetClass}
							className={`${select} mt-1 border border-border`}
						>
							<option value="">Any</option>
							{options.assetClasses.map((entry) => (
								<option key={entry} value={entry}>
									{entry}
								</option>
							))}
						</select>
					</label>

					<label className="min-w-36 flex-1">
						<span className="fx-eyebrow text-muted/70">Jurisdiction</span>
						<select
							name="place"
							defaultValue={filters.jurisdiction}
							className={`${select} mt-1 border border-border`}
						>
							<option value="">Any</option>
							{options.jurisdictions.map((entry) => (
								<option key={entry} value={entry}>
									{entry}
								</option>
							))}
						</select>
					</label>

					{options.networks ? (
						<label className="min-w-32 flex-1">
							<span className="fx-eyebrow text-muted/70">Network</span>
							<select
								name="chain"
								defaultValue={filters.network}
								className={`${select} mt-1 border border-border`}
							>
								<option value="">Any</option>
								{options.networks.map((entry) => (
									<option key={entry} value={entry}>
										{entry}
									</option>
								))}
							</select>
						</label>
					) : null}

					<label className="w-24">
						<span className="fx-eyebrow text-muted/70">Currency</span>
						<select
							name="ccy"
							defaultValue={filters.currency}
							className={`${select} mt-1 border border-border`}
						>
							<option value="">Any</option>
							{options.currencies.map((entry) => (
								<option key={entry} value={entry}>
									{entry}
								</option>
							))}
						</select>
					</label>

					<label className="min-w-40 flex-1">
						<span className="fx-eyebrow text-muted/70">Search</span>
						<input
							type="search"
							name="q"
							defaultValue={filters.q}
							placeholder="Name or issuer"
							className={`${select} mt-1 border border-border placeholder:text-muted/50`}
						/>
					</label>

					{sorts ? (
						<label className="w-40">
							<span className="fx-eyebrow text-muted/70">Sort</span>
							<select
								name="sort"
								defaultValue={filters.sort}
								className={`${select} mt-1 border border-border`}
							>
								{sorts.map((entry) => (
									<option key={entry.key} value={entry.key}>
										{entry.label}
									</option>
								))}
							</select>
						</label>
					) : null}

					<button
						type="submit"
						className="fx-eyebrow min-h-9 cursor-pointer border border-primary/50 px-3.5 font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-background"
					>
						Apply
					</button>

					<Link
						href={href(path, keep, filters, {
							assetClass: "",
							jurisdiction: "",
							currency: "",
							network: "",
							q: "",
							page: 1,
						})}
						className="fx-eyebrow min-h-9 self-end px-1 leading-9 text-muted transition-colors hover:text-foreground"
					>
						Clear
					</Link>
				</div>
			</form>

			{total === 0 ? (
				<p className="px-5 py-8 text-pretty text-muted">{empty}</p>
			) : (
				<>
					{/* Column headings, on the same grid the rows use. */}
					<div
						className={`hidden gap-x-6 border-b border-border bg-surface-muted/50 px-5 py-2 lg:grid ${
							showVerdict ? COLUMNS : BROWSE_COLUMNS
						} ${showVerdict ? "" : ""}`}
					>
						{headings.map((heading, index) => (
							<span
								key={heading}
								className={`fx-eyebrow text-muted/70 ${
									index >= 4 ? "text-right" : ""
								}`}
							>
								{heading}
							</span>
						))}
					</div>

					<ul>
						{rows.map((match) => (
							<li key={match.offering.id}>
								<Line match={match} showVerdict={showVerdict} />
							</li>
						))}
					</ul>

					<div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-3.5">
						<p
							className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${meta}`}
						>
							<span>
								{(start + 1).toLocaleString("en-GB")}–
								{Math.min(start + perPage, total).toLocaleString("en-GB")} of{" "}
								{total.toLocaleString("en-GB")}
							</span>

							<span className="flex items-center gap-px bg-border">
								{PAGE_SIZES.map((size) => (
									<Link
										key={size}
										href={href(path, keep, filters, {
											perPage: size,
											page: 1,
										})}
										aria-current={size === perPage ? "true" : undefined}
										className={`px-2.5 py-1 transition-colors ${
											size === perPage
												? "bg-surface-muted text-foreground"
												: "bg-surface text-muted hover:text-foreground"
										}`}
									>
										{size}
									</Link>
								))}
							</span>
							<span className="text-muted/60">per page</span>
						</p>

						<div className="flex items-center gap-px bg-border">
							<PageLink
								href={href(path, keep, filters, { page: page - 1 })}
								disabled={page <= 1}
							>
								Previous
							</PageLink>

							<span className="fx-eyebrow bg-surface px-3.5 py-2 text-muted">
								Page {page} of {pages}
							</span>

							<PageLink
								href={href(path, keep, filters, { page: page + 1 })}
								disabled={page >= pages}
							>
								Next
							</PageLink>
						</div>
					</div>
				</>
			)}
		</Panel>
	);
}

function PageLink({
	href: target,
	disabled,
	children,
}: {
	href: string;
	disabled: boolean;
	children: string;
}) {
	if (disabled) {
		return (
			<span className="fx-eyebrow bg-surface px-3.5 py-2 text-muted/40">
				{children}
			</span>
		);
	}

	return (
		<Link
			href={target}
			className="fx-eyebrow bg-surface px-3.5 py-2 text-muted transition-colors hover:text-foreground"
		>
			{children}
		</Link>
	);
}
