import Link from "next/link";

import type { Match, Status } from "@/lib/sourcing/match";
import type { Offering } from "@/lib/sourcing/types";

import { Panel } from "../../_components/panel";

/*
 * The sourced deals, as one table rather than three lists.
 *
 * Three panels made the shape of the answer clear when there were four
 * offerings and unusable at thirteen hundred: you cannot compare a match
 * against an exclusion if they are in different sections, and there was no way
 * to ask "what is available in Singapore" without reading all of it.
 *
 * Every row is a <details>. The accordion is the platform's, not ours — it
 * opens without JavaScript, it is keyboard operable and screen readers
 * announce it, and the summary keeps the same grid as the header above it so
 * an expanded row does not break the columns.
 */

const PER_PAGE = 25;

export type Filters = {
	verdict: string;
	assetClass: string;
	jurisdiction: string;
	currency: string;
	q: string;
	page: number;
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

function href(base: string, filters: Filters, changes: Partial<Filters>) {
	const merged = { ...filters, ...changes };
	const params = new URLSearchParams();

	if (merged.verdict !== "all") params.set("verdict", merged.verdict);
	if (merged.assetClass) params.set("class", merged.assetClass);
	if (merged.jurisdiction) params.set("place", merged.jurisdiction);
	if (merged.currency) params.set("ccy", merged.currency);
	if (merged.q) params.set("q", merged.q);
	if (merged.page > 1) params.set("page", String(merged.page));
	if (base) params.set("mandate", base);

	const query = params.toString();
	return `/dashboard/sourcing${query ? `?${query}` : ""}`;
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

function Row({ match }: { match: Match }) {
	const o: Offering = match.offering;

	return (
		<details className="group border-b border-border last:border-b-0">
			<summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-muted lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_8rem] [&::-webkit-details-marker]:hidden">
				<span className="min-w-0 text-sm font-semibold">
					<span
						aria-hidden
						className="mr-2 inline-block text-muted transition-transform group-open:rotate-90"
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

				<span className={`hidden lg:block ${meta} text-right tabular-nums`}>
					{num(o.minimum) ?? "—"}
					{o.currency ? (
						<span className="ml-1 opacity-70">{o.currency}</span>
					) : null}
				</span>

				<span className={`fx-eyebrow text-right ${statusTone[match.status]}`}>
					{statusLabel[match.status]}
				</span>
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
				) : (
					<p className="text-sm text-muted">
						This mandate states no criterion that touches this offering.
					</p>
				)}

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
					<Detail
						label="Management fee"
						value={
							num(o.management_fee, 2) ? `${num(o.management_fee, 2)}` : null
						}
					/>
					<Detail
						label="Performance fee"
						value={num(o.performance_fee, 2) ?? null}
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

export function ResultsTable({
	matches,
	filters,
	mandateId,
	options,
}: {
	matches: Match[];
	filters: Filters;
	mandateId: string;
	options: {
		assetClasses: string[];
		jurisdictions: string[];
		currencies: string[];
	};
}) {
	const total = matches.length;
	const pages = Math.max(1, Math.ceil(total / PER_PAGE));
	const page = Math.min(Math.max(1, filters.page), pages);
	const start = (page - 1) * PER_PAGE;
	const visible = matches.slice(start, start + PER_PAGE);

	const select =
		"min-h-9 w-full bg-surface px-2 font-mono text-xs text-foreground outline-none focus:bg-surface-muted";

	return (
		<Panel
			title="Sourced deals"
			status={
				<span className="text-muted">
					{total.toLocaleString("en-GB")} shown
				</span>
			}
		>
			{/* GET, so any view of the index is a URL you can send to someone. */}
			{/* Verdict on its own line: it is the coarsest cut and the one people
			    reach for first, so it should not compete with four dropdowns. */}
			<div className="border-b border-border px-5 py-3">
				<nav className="inline-flex flex-wrap gap-px bg-border">
					{verdicts.map((entry) => (
						<Link
							key={entry.key}
							href={href(mandateId, filters, {
								verdict: entry.key,
								page: 1,
							})}
							aria-current={entry.key === filters.verdict ? "page" : undefined}
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

			{/* GET, so any view of the index is a URL you can send to someone. */}
			<form className="border-b border-border px-5 py-3.5">
				<input type="hidden" name="mandate" value={mandateId} />
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

					<label className="w-28">
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

					<button
						type="submit"
						className="fx-eyebrow min-h-9 cursor-pointer border border-primary/50 px-3.5 font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-background"
					>
						Apply
					</button>

					<Link
						href={href(mandateId, filters, {
							assetClass: "",
							jurisdiction: "",
							currency: "",
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
				<p className="px-5 py-8 text-pretty text-muted">
					Nothing matches those filters. Widen them, or clear them to see the
					whole index against this mandate.
				</p>
			) : (
				<>
					{/* Column headings, on the same grid the rows use. */}
					<div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_8rem] gap-x-6 border-b border-border bg-surface-muted/50 px-5 py-2 lg:grid">
						{[
							"Offering",
							"Issuer",
							"Asset class",
							"Jurisdiction",
							"Minimum",
							"Verdict",
						].map((heading, index) => (
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
						{visible.map((match) => (
							<li key={match.offering.id}>
								<Row match={match} />
							</li>
						))}
					</ul>

					<div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-3.5">
						<p className={meta}>
							{(start + 1).toLocaleString("en-GB")}–
							{Math.min(start + PER_PAGE, total).toLocaleString("en-GB")} of{" "}
							{total.toLocaleString("en-GB")}
						</p>

						<div className="flex items-center gap-px bg-border">
							<PageLink
								href={href(mandateId, filters, { page: page - 1 })}
								disabled={page <= 1}
							>
								Previous
							</PageLink>

							<span className="fx-eyebrow bg-surface px-3.5 py-2 text-muted">
								Page {page} of {pages}
							</span>

							<PageLink
								href={href(mandateId, filters, { page: page + 1 })}
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
