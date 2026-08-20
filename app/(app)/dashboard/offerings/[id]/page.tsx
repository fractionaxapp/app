import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import { findOffering } from "@/lib/db/sourcing";

import { Panel } from "../../../_components/panel";

export const metadata: Metadata = { title: "Offering" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const meta = "font-mono text-xs tracking-wide text-muted";

function num(value: string | null, digits = 0) {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return null;

	return parsed.toLocaleString("en-GB", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
}

function Field({
	label,
	value,
	hint,
}: {
	label: string;
	value: React.ReactNode | null;
	hint?: string;
}) {
	return (
		<div className="border-b border-border px-5 py-3.5 last:border-b-0">
			<dt className="fx-eyebrow text-muted">{label}</dt>
			<dd className="mt-1.5 font-mono text-sm break-words">
				{value === null || value === undefined || value === "" ? (
					<span className="text-muted/60">Not published</span>
				) : (
					value
				)}
			</dd>
			{hint ? <p className="mt-1 text-xs text-muted/70">{hint}</p> : null}
		</div>
	);
}

/*
 * The venue's own record, rendered as it arrived.
 *
 * Every mapped column above is an interpretation of this — a path we chose, a
 * number we coerced. Showing the source underneath means a figure that looks
 * wrong can be checked against what was actually published without anyone
 * going to the database, and a field we never mapped is still visible to
 * whoever needs it.
 */
function Raw({ value, depth = 0 }: { value: unknown; depth?: number }) {
	if (value === null || value === undefined) {
		return <span className="text-muted/60">null</span>;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		const text = String(value);

		if (/^https?:\/\//.test(text)) {
			return (
				<a
					href={text}
					target="_blank"
					rel="noopener noreferrer"
					className="break-all text-primary underline underline-offset-4"
				>
					{text}
				</a>
			);
		}

		return <span className="break-words">{text}</span>;
	}

	// Four levels is deeper than any venue payload seen so far, and a guard
	// against one that contains itself.
	if (depth > 4) return <span className="text-muted/60">…</span>;

	if (Array.isArray(value)) {
		if (value.length === 0) return <span className="text-muted/60">empty</span>;

		return (
			<ul className="flex flex-col gap-1">
				{value.map((entry, index) => (
					<li key={index}>
						<Raw value={entry} depth={depth + 1} />
					</li>
				))}
			</ul>
		);
	}

	const entries = Object.entries(value as Record<string, unknown>);
	if (entries.length === 0) return <span className="text-muted/60">empty</span>;

	return (
		<dl className={depth === 0 ? "" : "mt-1 border-l border-border pl-3"}>
			{entries.map(([key, entry]) => (
				<div
					key={key}
					className={
						depth === 0
							? "grid gap-x-6 gap-y-1 border-b border-border px-5 py-3 last:border-b-0 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
							: "grid gap-x-4 gap-y-1 py-1 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]"
					}
				>
					<dt className={`${meta} min-w-0`}>{key}</dt>
					<dd className="min-w-0 font-mono text-sm">
						<Raw value={entry} depth={depth + 1} />
					</dd>
				</div>
			))}
		</dl>
	);
}

/*
 * One offering, in full.
 *
 * The table can only show what fits a row. This is where everything goes: the
 * fields we mapped, the terms the matcher reads, the provenance, and the
 * venue's untouched payload underneath.
 */
export default async function OfferingPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const access = await getAccess();

	if (access.state === "signed-out") return null;
	if (access.state === "waiting") redirect("/dashboard");

	if (!isDatabaseEnabled) notFound();

	const { id } = await params;

	// Postgres errors on a malformed uuid; check before asking it to.
	if (!UUID.test(id)) notFound();

	const offering = await findOffering(id);
	if (!offering) notFound();

	const money = (value: string | null) =>
		num(value)
			? `${num(value)}${offering.currency ? ` ${offering.currency}` : ""}`
			: null;

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div>
				<Link
					href="/dashboard/discover"
					className="fx-eyebrow text-muted transition-colors hover:text-foreground"
				>
					← Back to discover
				</Link>

				<h1 className="mt-4 text-[clamp(22px,2.6vw,34px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance uppercase">
					{offering.title}
				</h1>

				<p
					className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 ${meta}`}
				>
					{offering.symbol ? <span>{offering.symbol}</span> : null}
					{offering.issuer ? <span>{offering.issuer}</span> : null}
					{offering.platform ? <span>{offering.platform}</span> : null}
					{offering.withdrawn_at ? (
						<span className="text-danger">
							Withdrawn {stamp.format(offering.withdrawn_at)}
						</span>
					) : (
						<span className="text-primary">Listed</span>
					)}
				</p>

				{offering.url ? (
					<p className="mt-4">
						<a
							href={offering.url}
							target="_blank"
							rel="noopener noreferrer"
							className="fx-eyebrow inline-flex min-h-11 items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary"
						>
							Open at the venue
						</a>
					</p>
				) : null}
			</div>

			{offering.description ? (
				<Panel title="What the venue says">
					<p className="px-5 py-5 text-pretty text-muted">
						{offering.description}
					</p>
				</Panel>
			) : null}

			<div className="grid gap-6 lg:grid-cols-2">
				<Panel title="Terms">
					<dl>
						<Field label="Minimum" value={money(offering.minimum)} />
						<Field label="Currency" value={offering.currency} />
						<Field
							label="Net yield"
							value={
								num(offering.net_yield, 2)
									? `${num(offering.net_yield, 2)}%`
									: null
							}
						/>
						<Field
							label="Term"
							value={
								offering.term_months ? `${offering.term_months} months` : null
							}
						/>
						<Field label="Seniority" value={offering.seniority} />
						<Field
							label="DSCR"
							value={num(offering.dscr, 2) ? `${num(offering.dscr, 2)}×` : null}
						/>
						<Field
							label="Reported return"
							value={
								num(offering.reported_return, 2)
									? `${num(offering.reported_return, 2)}%`
									: null
							}
							hint="As the venue publishes it, with no stated basis — annualised, trailing, or since inception is not said. Not used for matching."
						/>
					</dl>
				</Panel>

				<Panel title="The offering">
					<dl>
						<Field label="Asset class" value={offering.asset_class} />
						<Field label="Jurisdiction" value={offering.jurisdiction} />
						<Field label="Structure" value={offering.fund_structure} />
						<Field
							label="Networks"
							value={offering.networks?.join(", ") ?? null}
						/>
						<Field
							label="Investors"
							value={offering.investor_types?.join(", ") ?? null}
						/>
						<Field label="Income treatment" value={offering.income_treatment} />
						<Field label="Inception" value={offering.inception} />
					</dl>
				</Panel>

				<Panel title="Size and fees">
					<dl>
						<Field
							label="Assets under management"
							value={num(offering.aum) ?? null}
						/>
						<Field
							label="Holders"
							value={offering.holders_count?.toLocaleString("en-GB") ?? null}
						/>
						<Field
							label="Management fee"
							value={num(offering.management_fee)}
						/>
						<Field
							label="Performance fee"
							value={num(offering.performance_fee)}
						/>
						<Field
							label="Subscription fee"
							value={num(offering.subscription_fee)}
						/>
						<Field
							label="Redemption fee"
							value={num(offering.redemption_fee)}
						/>
					</dl>

					{/*
					 * The venue publishes fees as bare numbers and never says in what
					 * unit. Across this source they run from 0 to 2,500, and a 2,500%
					 * performance fee does not exist, so they are almost certainly basis
					 * points — but "almost certainly" is not something to render as a
					 * percentage beside an investment. Shown unconverted, with the
					 * reasoning, so nobody reads 1,000 as a thousand per cent.
					 */}
					<p className="border-t border-border px-5 py-4 text-xs text-pretty text-muted">
						Fees are shown exactly as the venue publishes them and are not
						converted. Across this source the figures run from 0 to 2,500, which
						is consistent with basis points — 2,500 being 25% — but no unit is
						stated anywhere in the payload, so none is asserted here.
					</p>
				</Panel>

				<Panel title="Dealing and provenance">
					<dl>
						<Field
							label="Subscriptions"
							value={offering.subscription_frequency}
						/>
						<Field label="Redemptions" value={offering.redemption_frequency} />
						<Field label="Source" value={offering.source_label} />
						<Field label="Venue identifier" value={offering.external_id} />
						<Field
							label="First seen"
							value={stamp.format(offering.first_seen)}
						/>
						<Field label="Last seen" value={stamp.format(offering.last_seen)} />
					</dl>
				</Panel>
			</div>

			<Panel
				title="As published"
				status={<span className="text-muted">Untouched</span>}
			>
				<p className="border-b border-border px-5 py-3 text-sm text-pretty text-muted">
					Everything above is our reading of this. Below is what the venue
					actually returned, including the fields we do not map.
				</p>

				<Raw value={offering.raw} />
			</Panel>
		</div>
	);
}
