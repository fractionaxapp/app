import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import { findOffering } from "@/lib/db/sourcing";

import { Artwork } from "../../../_components/artwork";
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

function compact(value: string | null) {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return null;

	return parsed.toLocaleString("en-GB", {
		notation: "compact",
		maximumFractionDigits: 1,
	});
}

const IMAGE_KEY = /icon|image|logo|avatar|thumbnail|photo/i;
const IMAGE_FILE = /\.(png|jpe?g|gif|svg|webp|avif)(\?|$)/i;

/** Pull a nested value out of the venue's payload without throwing on gaps. */
function at(raw: unknown, path: string): string | null {
	const value = path
		.split(".")
		.reduce<unknown>(
			(carry, key) =>
				carry && typeof carry === "object"
					? (carry as Record<string, unknown>)[key]
					: undefined,
			raw,
		);

	return typeof value === "string" && value.trim() ? value : null;
}

/*
 * The venue's own record, rendered as it arrived.
 *
 * Every field above this is our reading of it — a path we chose, a number we
 * coerced. Keeping the source underneath means a figure that looks wrong can
 * be checked against what was published without opening a database, and a
 * field we never mapped is still there for whoever needs it.
 *
 * A URL that names an image is shown as one. Half these payloads are artwork,
 * and a column of hundred-character CDN links tells the reader nothing they
 * can see.
 */
function Raw({
	value,
	name = "",
	depth = 0,
}: {
	value: unknown;
	name?: string;
	depth?: number;
}) {
	if (value === null || value === undefined) {
		return <span className="text-muted/50">null</span>;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		const text = String(value);

		if (/^https?:\/\//.test(text)) {
			const image = IMAGE_KEY.test(name) || IMAGE_FILE.test(text);

			return image ? (
				/*
				 * The picture, and only the picture. Showing the address beside it
				 * doubled the row height to say in a hundred characters what the
				 * image says at a glance. The image is still the link, so the
				 * original is one click away.
				 */
				<a
					href={text}
					target="_blank"
					rel="noopener noreferrer"
					title={text}
					className="inline-flex"
				>
					<Artwork src={text} alt={name} size={32} />
				</a>
			) : (
				<a
					href={text}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary break-all underline underline-offset-4"
				>
					{text}
				</a>
			);
		}

		return <span className="break-words">{text}</span>;
	}

	// Deeper than any venue payload seen so far, and a guard against one that
	// contains itself.
	if (depth > 4) return <span className="text-muted/50">…</span>;

	if (Array.isArray(value)) {
		if (value.length === 0) return <span className="text-muted/50">empty</span>;

		return (
			<ul className="flex flex-col gap-1">
				{value.map((entry, index) => (
					<li key={index}>
						<Raw value={entry} name={name} depth={depth + 1} />
					</li>
				))}
			</ul>
		);
	}

	const entries = Object.entries(value as Record<string, unknown>);
	if (entries.length === 0) return <span className="text-muted/50">empty</span>;

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
						<Raw value={entry} name={key} depth={depth + 1} />
					</dd>
				</div>
			))}
		</dl>
	);
}

/**
 * A row in a detail panel.
 *
 * `always` keeps a field visible when the venue did not publish it. That is
 * right for the terms someone is deciding on — a missing yield is itself the
 * answer — and wrong everywhere else, where a column of "Not published" is
 * only noise to read past.
 */
function Field({
	label,
	value,
	hint,
	always = false,
}: {
	label: string;
	value: React.ReactNode | null;
	hint?: string;
	always?: boolean;
}) {
	const missing = value === null || value === undefined || value === "";
	if (missing && !always) return null;

	return (
		<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border px-5 py-3 last:border-b-0">
			<dt className="fx-eyebrow text-muted">{label}</dt>
			<dd className="text-right font-mono text-sm break-words">
				{missing ? <span className="text-muted/50">Not published</span> : value}
			</dd>
			{hint ? (
				<p className="w-full text-xs text-pretty text-muted/70">{hint}</p>
			) : null}
		</div>
	);
}

/*
 * One offering, in full.
 *
 * Laid out as a record rather than four identical tables: the mark and the
 * headline figures first, then what the venue says, then the detail grouped by
 * the question it answers. Nothing is stated twice — the currency lives with
 * the minimum, the asset class and jurisdiction are labels under the title
 * rather than rows further down, and the payload that repeats all of it is
 * folded away until asked for.
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

	const raw = offering.raw;
	const managerIcon = at(raw, "manager.icon_url");
	const placeIcon = at(raw, "jurisdiction.icon");

	/*
	 * The headline figures, and only the ones the venue actually gave. A tile
	 * reading "not published" is a tile that should not be there.
	 *
	 * Laid out with flex rather than a fixed grid for the same reason: three
	 * facts in a four-column grid leaves a dead cell showing the hairline
	 * colour, and how many there are depends on the offering.
	 */
	const facts = [
		offering.minimum
			? {
					label: "Minimum",
					value: num(offering.minimum),
					unit: offering.currency,
				}
			: null,
		offering.net_yield
			? {
					label: "Net yield",
					value: `${num(offering.net_yield, 2)}%`,
					unit: null,
				}
			: null,
		offering.aum
			? { label: "Assets", value: compact(offering.aum), unit: null }
			: null,
		offering.holders_count !== null
			? {
					label: "Holders",
					value: offering.holders_count.toLocaleString("en-GB"),
					unit: null,
				}
			: null,
	].filter(Boolean) as { label: string; value: string; unit: string | null }[];

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<Link
				href="/dashboard/discover"
				className="fx-eyebrow text-muted transition-colors hover:text-foreground"
			>
				← Back to discover
			</Link>

			<header className="border border-border bg-surface">
				<div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 px-5 py-6">
					<div className="flex min-w-0 items-start gap-4">
						{offering.icon_url ? (
							<span className="mt-1 flex size-12 shrink-0 items-center justify-center border border-border bg-background">
								<Artwork src={offering.icon_url} alt="" size={32} />
							</span>
						) : null}

						<div className="min-w-0">
							<h1 className="text-[clamp(20px,2.4vw,30px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance uppercase">
								{offering.title}
							</h1>

							<p
								className={`mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 ${meta}`}
							>
								{offering.symbol ? (
									<span className="border border-border px-2 py-0.5 text-foreground">
										{offering.symbol}
									</span>
								) : null}

								{offering.issuer ? (
									<span className="flex items-center gap-2">
										{managerIcon ? (
											<Artwork src={managerIcon} alt="" size={16} />
										) : null}
										{offering.issuer}
									</span>
								) : null}

								{offering.platform && offering.platform !== offering.issuer ? (
									<span>via {offering.platform}</span>
								) : null}

								{offering.withdrawn_at ? (
									<span className="text-danger">
										Withdrawn {stamp.format(offering.withdrawn_at)}
									</span>
								) : (
									<span className="flex items-center gap-2 text-primary">
										<span aria-hidden className="size-1.5 bg-primary" />
										Listed
									</span>
								)}
							</p>
						</div>
					</div>

					{offering.url ? (
						<a
							href={offering.url}
							target="_blank"
							rel="noopener noreferrer"
							className="fx-eyebrow inline-flex min-h-11 items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary"
						>
							Open at the venue
						</a>
					) : null}
				</div>

				{facts.length > 0 ? (
					<div className="flex flex-wrap gap-px border-t border-border bg-border">
						{facts.map((fact) => (
							<div
								key={fact.label}
								className="min-w-44 flex-1 bg-surface px-5 py-4"
							>
								<p className="fx-eyebrow text-muted">{fact.label}</p>
								<p className="mt-2 font-mono text-2xl leading-none font-medium tracking-tight text-accent tabular-nums">
									{fact.value}
									{fact.unit ? (
										<span className="ml-1.5 text-sm text-muted">
											{fact.unit}
										</span>
									) : null}
								</p>
							</div>
						))}
					</div>
				) : null}

				{/* Where it sits, as labels rather than another table of rows. */}
				<div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3.5">
					{offering.asset_class ? (
						<span className="fx-eyebrow border border-border px-2.5 py-1 text-muted">
							{offering.asset_class}
						</span>
					) : null}

					{offering.jurisdiction ? (
						<span className="fx-eyebrow flex items-center gap-2 border border-border px-2.5 py-1 text-muted">
							{placeIcon ? <Artwork src={placeIcon} alt="" size={14} /> : null}
							{offering.jurisdiction}
						</span>
					) : null}

					{offering.networks?.map((network) => (
						<span
							key={network}
							className="fx-eyebrow border border-border px-2.5 py-1 text-muted"
						>
							{network}
						</span>
					))}
				</div>
			</header>

			{offering.description ? (
				<div className="px-1">
					<p className="fx-eyebrow text-muted/60">In the words of the venue</p>
					<p className="mt-3 max-w-prose text-pretty text-muted">
						{offering.description}
					</p>
				</div>
			) : null}

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{/*
				 * Terms keeps its gaps visible. Someone deciding on this needs to see
				 * that no yield and no seniority were published — that absence is the
				 * answer, not missing data to skip past.
				 */}
				<Panel title="Terms">
					<dl>
						<Field
							label="Minimum"
							always
							value={
								num(offering.minimum)
									? `${num(offering.minimum)}${
											offering.currency ? ` ${offering.currency}` : ""
										}`
									: null
							}
						/>
						<Field
							label="Net yield"
							always
							value={
								num(offering.net_yield, 2)
									? `${num(offering.net_yield, 2)}%`
									: null
							}
						/>
						<Field
							label="Term"
							always
							value={
								offering.term_months ? `${offering.term_months} months` : null
							}
						/>
						<Field label="Seniority" always value={offering.seniority} />
						<Field
							label="DSCR"
							always
							value={num(offering.dscr, 2) ? `${num(offering.dscr, 2)}×` : null}
						/>
						<Field
							label="Reported return"
							value={num(offering.reported_return, 2)}
							hint="As the venue publishes it, with no stated basis — annualised, trailing, or since inception is not said. Not used for matching."
						/>
					</dl>
				</Panel>

				<Panel title="Structure">
					<dl>
						<Field label="Legal form" value={offering.fund_structure} />
						<Field
							label="Investors"
							value={offering.investor_types?.join(", ") ?? null}
						/>
						<Field label="Income" value={offering.income_treatment} />
						<Field label="Inception" value={offering.inception} />
						<Field
							label="Subscriptions"
							value={offering.subscription_frequency}
						/>
						<Field label="Redemptions" value={offering.redemption_frequency} />
					</dl>
				</Panel>

				<Panel title="Fees">
					<dl>
						<Field label="Management" value={num(offering.management_fee)} />
						<Field label="Performance" value={num(offering.performance_fee)} />
						<Field
							label="Subscription"
							value={num(offering.subscription_fee)}
						/>
						<Field label="Redemption" value={num(offering.redemption_fee)} />
					</dl>

					{/*
					 * The venue publishes fees as bare numbers and never says in what
					 * unit. Across this source they run from 0 to 2,500, and a 2,500%
					 * performance fee does not exist, so they are almost certainly basis
					 * points — but "almost certainly" is not something to render as a
					 * percentage beside an investment.
					 */}
					<p className="border-t border-border px-5 py-4 text-xs text-pretty text-muted">
						Shown exactly as the venue publishes them, unconverted. Across this
						source the figures run from 0 to 2,500, which is consistent with
						basis points — 2,500 being 25% — but no unit is stated anywhere in
						the payload, so none is asserted here.
					</p>
				</Panel>
			</div>

			<p
				className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 ${meta}`}
			>
				<span>{offering.source_label}</span>
				<span>id {offering.external_id}</span>
				<span>first seen {stamp.format(offering.first_seen)}</span>
				<span>last seen {stamp.format(offering.last_seen)}</span>
			</p>

			{/* Folded away by default: it repeats everything above, on purpose. */}
			<details className="group border border-border bg-surface">
				<summary className="fx-eyebrow flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-muted transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
					As published by the venue
					<span
						aria-hidden
						className="inline-block transition-transform group-open:rotate-90"
					>
						›
					</span>
				</summary>

				<p className="border-y border-border px-5 py-3 text-sm text-pretty text-muted">
					Everything above is our reading of this. Below is exactly what the
					venue returned, including the fields we do not map.
				</p>

				<Raw value={raw} />
			</details>
		</div>
	);
}
