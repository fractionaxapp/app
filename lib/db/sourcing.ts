import "server-only";

import type {
	Criteria,
	Mandate,
	NormalisedOffering,
	Offering,
} from "@/lib/sourcing/types";

import { query, transaction } from "./client";

export type SourceKind = "json" | "rss" | "rwa" | "nextdata";

/* Reads and writes behind deal sourcing: venues, what they published, mandates. */

export type Source = {
	id: string;
	slug: string;
	label: string;
	kind: SourceKind;
	url: string;
	mapping: Record<string, unknown>;
	enabled: boolean;
	last_run_at: Date | null;
	last_status: "ok" | "error" | null;
	last_error: string | null;
	last_count: number | null;
	created_at: Date;
};

export async function listSources() {
	return query<Source>("SELECT * FROM sources ORDER BY label");
}

export async function listEnabledSources() {
	return query<Source>("SELECT * FROM sources WHERE enabled ORDER BY label");
}

export async function findSource(id: string) {
	const rows = await query<Source>("SELECT * FROM sources WHERE id = $1", [id]);
	return rows[0] ?? null;
}

export async function createSource(input: {
	slug: string;
	label: string;
	kind: SourceKind;
	url: string;
	mapping: Record<string, unknown>;
}) {
	const rows = await query<{ id: string }>(
		`INSERT INTO sources (slug, label, kind, url, mapping)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (slug) DO UPDATE SET
			label      = EXCLUDED.label,
			kind       = EXCLUDED.kind,
			url        = EXCLUDED.url,
			mapping    = EXCLUDED.mapping,
			updated_at = now()
		RETURNING id`,
		[
			input.slug,
			input.label,
			input.kind,
			input.url,
			JSON.stringify(input.mapping),
		],
	);

	return rows[0].id;
}

export async function updateMapping(
	id: string,
	mapping: Record<string, unknown>,
) {
	await query(
		"UPDATE sources SET mapping = $2, updated_at = now() WHERE id = $1",
		[id, JSON.stringify(mapping)],
	);
}

export async function setSourceEnabled(id: string, enabled: boolean) {
	await query(
		"UPDATE sources SET enabled = $2, updated_at = now() WHERE id = $1",
		[id, enabled],
	);
}

export async function deleteSource(id: string) {
	await query("DELETE FROM sources WHERE id = $1", [id]);
}

export async function recordRun(
	id: string,
	result: {
		status: "ok" | "error";
		error?: string | null;
		count?: number | null;
	},
) {
	await query(
		`UPDATE sources SET
			last_run_at = now(),
			last_status = $2,
			last_error  = $3,
			last_count  = $4,
			updated_at  = now()
		WHERE id = $1`,
		[id, result.status, result.error ?? null, result.count ?? null],
	);
}

/**
 * Write what a crawl found.
 *
 * Everything happens in one transaction, and the withdrawal sweep is part of
 * it: a run that half-succeeded must not leave the index claiming a venue has
 * withdrawn offerings it never got to look at.
 */
/*
 * Rows per INSERT statement.
 *
 * One statement per offering is fine against a local database and ruinous
 * against a hosted one: 1,301 offerings became 1,301 round trips inside a
 * single transaction, minutes of it, holding a pool connection the whole time
 * while every other request queued behind it. Batching turns that into single
 * figures. 14 columns × 200 rows is well inside Postgres's parameter limit.
 */
const BATCH = 200;

const OFFERING_FIELDS = [
	"source_id",
	"external_id",
	"url",
	"title",
	"issuer",
	"asset_class",
	"currency",
	"net_yield",
	"term_months",
	"seniority",
	"minimum",
	"jurisdiction",
	"dscr",
	"icon_url",
	"symbol",
	"platform",
	"networks",
	"fund_structure",
	"subscription_frequency",
	"redemption_frequency",
	"income_treatment",
	"investor_types",
	"aum",
	"holders_count",
	"management_fee",
	"performance_fee",
	"subscription_fee",
	"redemption_fee",
	"inception",
	"description",
	"reported_return",
	"raw",
] as const;

const UPDATE_ON_CONFLICT = `
	url          = EXCLUDED.url,
	title        = EXCLUDED.title,
	issuer       = EXCLUDED.issuer,
	asset_class  = EXCLUDED.asset_class,
	currency     = EXCLUDED.currency,
	net_yield    = EXCLUDED.net_yield,
	term_months  = EXCLUDED.term_months,
	seniority    = EXCLUDED.seniority,
	minimum      = EXCLUDED.minimum,
	jurisdiction = EXCLUDED.jurisdiction,
	dscr         = EXCLUDED.dscr,
	icon_url               = EXCLUDED.icon_url,
	symbol                 = EXCLUDED.symbol,
	platform               = EXCLUDED.platform,
	networks               = EXCLUDED.networks,
	fund_structure         = EXCLUDED.fund_structure,
	subscription_frequency = EXCLUDED.subscription_frequency,
	redemption_frequency   = EXCLUDED.redemption_frequency,
	income_treatment       = EXCLUDED.income_treatment,
	investor_types         = EXCLUDED.investor_types,
	aum                    = EXCLUDED.aum,
	holders_count          = EXCLUDED.holders_count,
	management_fee         = EXCLUDED.management_fee,
	performance_fee        = EXCLUDED.performance_fee,
	subscription_fee       = EXCLUDED.subscription_fee,
	redemption_fee         = EXCLUDED.redemption_fee,
	inception              = EXCLUDED.inception,
	description            = EXCLUDED.description,
	reported_return        = EXCLUDED.reported_return,
	raw          = EXCLUDED.raw,
	last_seen    = now(),
	-- Back from the dead: a re-listed offering is live again.
	withdrawn_at = NULL
`;

function rowValues(sourceId: string, offering: NormalisedOffering) {
	return [
		sourceId,
		offering.externalId,
		offering.url ?? null,
		offering.title,
		offering.issuer ?? null,
		offering.assetClass ?? null,
		offering.currency ?? null,
		offering.netYield ?? null,
		offering.termMonths ?? null,
		offering.seniority ?? null,
		offering.minimum ?? null,
		offering.jurisdiction ?? null,
		offering.dscr ?? null,
		offering.iconUrl ?? null,
		offering.symbol ?? null,
		offering.platform ?? null,
		offering.networks ?? null,
		offering.fundStructure ?? null,
		offering.subscriptionFrequency ?? null,
		offering.redemptionFrequency ?? null,
		offering.incomeTreatment ?? null,
		offering.investorTypes ?? null,
		offering.aum ?? null,
		offering.holdersCount ?? null,
		offering.managementFee ?? null,
		offering.performanceFee ?? null,
		offering.subscriptionFee ?? null,
		offering.redemptionFee ?? null,
		offering.inception ?? null,
		offering.description ?? null,
		offering.reportedReturn ?? null,
		JSON.stringify(offering.raw ?? {}),
	];
}

/**
 * Write what a crawl found.
 *
 * Everything happens in one transaction, and the withdrawal sweep is part of
 * it: a run that half-succeeded must not leave the index claiming a venue has
 * withdrawn offerings it never got to look at.
 */
export async function upsertOfferings(
	sourceId: string,
	offerings: NormalisedOffering[],
) {
	/*
	 * An empty list would mean the sweep below matches every row and withdraws
	 * the venue's entire catalogue. The crawler already returns early in that
	 * case, but the trap should not be left lying here for the next caller: a
	 * parse that silently yields nothing is exactly when this would fire.
	 */
	if (offerings.length === 0) return { stored: 0, withdrawn: 0 };

	return transaction(async (client) => {
		/*
		 * A venue listing the same identifier twice would make one statement
		 * update a row it had just inserted, which Postgres refuses outright.
		 * Last mention wins, as it would have with one statement per row.
		 */
		const unique = new Map<string, NormalisedOffering>();
		for (const offering of offerings) unique.set(offering.externalId, offering);

		const rows = [...unique.values()];

		for (let start = 0; start < rows.length; start += BATCH) {
			const chunk = rows.slice(start, start + BATCH);
			const params: unknown[] = [];

			const tuples = chunk.map((offering) => {
				const values = rowValues(sourceId, offering);
				const placeholders = values.map(
					(_, index) => `$${params.length + index + 1}`,
				);

				params.push(...values);
				return `(${placeholders.join(",")})`;
			});

			await client.query(
				`INSERT INTO offerings (${OFFERING_FIELDS.join(", ")})
				VALUES ${tuples.join(",")}
				ON CONFLICT (source_id, external_id) DO UPDATE SET ${UPDATE_ON_CONFLICT}`,
				params,
			);
		}

		const { rowCount } = await client.query(
			`UPDATE offerings SET withdrawn_at = now()
			WHERE source_id = $1
				AND withdrawn_at IS NULL
				AND NOT (external_id = ANY($2::text[]))`,
			[sourceId, rows.map((offering) => offering.externalId)],
		);

		return { stored: rows.length, withdrawn: rowCount ?? 0 };
	});
}

const OFFERING_COLUMNS = `
	o.id, o.source_id, s.label AS source_label, o.external_id, o.url, o.title,
	o.issuer, o.asset_class, o.currency, o.net_yield, o.term_months,
	o.seniority, o.minimum, o.jurisdiction, o.dscr,
	o.icon_url, o.symbol, o.platform, o.networks, o.fund_structure,
	o.subscription_frequency, o.redemption_frequency, o.income_treatment,
	o.investor_types, o.aum, o.holders_count, o.management_fee,
	o.performance_fee, o.subscription_fee, o.redemption_fee, o.inception,
	o.description, o.reported_return,
	o.first_seen, o.last_seen, o.withdrawn_at
`;

/**
 * Everything still listed, for the matcher to run over.
 *
 * Ordered by when we last saw it rather than by yield. The cap has to fall
 * somewhere, and "the most recently seen" is a rule that can be stated; taking
 * the highest yields first sounds better but collapses the moment a venue
 * publishes no yields, which is most of them — the order becomes whatever the
 * null sort happens to do, and the caller cannot say what was left out.
 *
 * The caller compares this length against the live count and tells the reader
 * when the two disagree.
 */
export async function listLiveOfferings(limit = 5000) {
	return query<Offering>(
		`SELECT ${OFFERING_COLUMNS}
		FROM offerings o JOIN sources s ON s.id = o.source_id
		WHERE o.withdrawn_at IS NULL
		ORDER BY o.last_seen DESC
		LIMIT $1`,
		[limit],
	);
}

export type Browse = {
	assetClass?: string;
	jurisdiction?: string;
	currency?: string;
	network?: string;
	q?: string;
	sort?: string;
	limit?: number;
	offset?: number;
};

/*
 * Sorts offered on the discover screen.
 *
 * Nulls last in every one of them: an offering that does not publish a figure
 * has not got the smallest one, and sorting it to the top of "smallest
 * minimum" would be a lie told by a null.
 */
const SORTS: Record<string, string> = {
	recent: "o.last_seen DESC, o.title ASC",
	name: "o.title ASC",
	minimum: "o.minimum ASC NULLS LAST, o.title ASC",
	"minimum-desc": "o.minimum DESC NULLS LAST, o.title ASC",
	aum: "o.aum DESC NULLS LAST, o.title ASC",
	holders: "o.holders_count DESC NULLS LAST, o.title ASC",
};

export const SORT_KEYS = Object.keys(SORTS);

/*
 * Browsing, as opposed to matching.
 *
 * Filtered, sorted and paged in Postgres rather than in the request. There is
 * no per-row reasoning to compute here — nothing to explain, only rows to show
 * — so none of the index needs to be in memory, and the cap the mandate screen
 * has to live with does not apply.
 */
export async function browseOfferings(options: Browse = {}) {
	const where: string[] = ["o.withdrawn_at IS NULL"];
	const params: unknown[] = [];

	const add = (clause: string, value: unknown) => {
		params.push(value);
		where.push(clause.replace("$?", `$${params.length}`));
	};

	if (options.assetClass) add("o.asset_class = $?", options.assetClass);
	if (options.jurisdiction) add("o.jurisdiction = $?", options.jurisdiction);
	if (options.currency) add("o.currency = $?", options.currency);
	if (options.network) add("$? = ANY(o.networks)", options.network);

	if (options.q?.trim()) {
		params.push(`%${options.q.trim()}%`);
		const index = params.length;
		where.push(
			`(o.title ILIKE $${index} OR o.issuer ILIKE $${index} OR o.symbol ILIKE $${index} OR o.platform ILIKE $${index})`,
		);
	}

	const clause = where.join(" AND ");
	const order = SORTS[options.sort ?? "recent"] ?? SORTS.recent;

	/*
	 * The ceiling is for the caller's benefit, not the database's: it stops a
	 * page size out of a URL asking for the whole index. It has to leave room
	 * for the sourcing screen, which loads in bulk to match against — clamping
	 * this to a page size silently ran mandates against the first hundred rows.
	 */
	const limit = Math.min(Math.max(1, options.limit ?? 25), 5000);
	const offset = Math.max(0, options.offset ?? 0);

	const rows = await query<Offering>(
		`SELECT ${OFFERING_COLUMNS}
		FROM offerings o JOIN sources s ON s.id = o.source_id
		WHERE ${clause}
		ORDER BY ${order}
		LIMIT ${limit} OFFSET ${offset}`,
		params,
	);

	const counted = await query<{ n: string }>(
		`SELECT count(*)::text AS n
		FROM offerings o JOIN sources s ON s.id = o.source_id
		WHERE ${clause}`,
		params,
	);

	return { rows, total: Number(counted[0]?.n ?? 0) };
}

/** The values the filters can offer, taken from what is actually indexed. */
export async function offeringFacets() {
	const [classes, places, currencies, networks] = await Promise.all([
		query<{ value: string }>(
			"SELECT DISTINCT asset_class AS value FROM offerings WHERE withdrawn_at IS NULL AND asset_class IS NOT NULL ORDER BY 1",
		),
		query<{ value: string }>(
			"SELECT DISTINCT jurisdiction AS value FROM offerings WHERE withdrawn_at IS NULL AND jurisdiction IS NOT NULL ORDER BY 1",
		),
		query<{ value: string }>(
			"SELECT DISTINCT currency AS value FROM offerings WHERE withdrawn_at IS NULL AND currency IS NOT NULL ORDER BY 1",
		),
		query<{ value: string }>(
			"SELECT DISTINCT unnest(networks) AS value FROM offerings WHERE withdrawn_at IS NULL AND networks IS NOT NULL ORDER BY 1",
		),
	]);

	const values = (rows: { value: string }[]) => rows.map((row) => row.value);

	return {
		assetClasses: values(classes),
		jurisdictions: values(places),
		currencies: values(currencies),
		networks: values(networks),
	};
}

/**
 * One offering, with the venue's original payload.
 *
 * `raw` is left out of the list queries — it is the whole record and there is
 * no sense shipping thirteen hundred of them to render a table — but the page
 * for a single offering is exactly where it earns its keep.
 *
 * The source's mapping comes with it so the page can say which of the venue's
 * keys produced which of our fields, and which it never reads at all.
 */
export async function findOffering(id: string) {
	const rows = await query<
		Offering & { raw: unknown; source_mapping: Record<string, unknown> }
	>(
		`SELECT ${OFFERING_COLUMNS}, o.raw, s.mapping AS source_mapping
		FROM offerings o JOIN sources s ON s.id = o.source_id
		WHERE o.id = $1`,
		[id],
	);

	return rows[0] ?? null;
}

export async function offeringStats() {
	const rows = await query<{ live: string; withdrawn: string; venues: string }>(
		`SELECT
			count(*) FILTER (WHERE withdrawn_at IS NULL)::text AS live,
			count(*) FILTER (WHERE withdrawn_at IS NOT NULL)::text AS withdrawn,
			count(DISTINCT source_id)::text AS venues
		FROM offerings`,
	);

	return {
		live: Number(rows[0]?.live ?? 0),
		withdrawn: Number(rows[0]?.withdrawn ?? 0),
		venues: Number(rows[0]?.venues ?? 0),
	};
}

export async function createMandate(input: {
	userId: string;
	statement: string;
	criteria: Criteria;
	parsedBy: "claude" | "minimax" | "rules";
}) {
	const rows = await query<{ id: string }>(
		`INSERT INTO mandates (user_id, statement, criteria, parsed_by)
		VALUES ($1, $2, $3, $4) RETURNING id`,
		[
			input.userId,
			input.statement,
			JSON.stringify(input.criteria),
			input.parsedBy,
		],
	);

	return rows[0].id;
}

export async function listMandates(userId: string) {
	return query<Mandate>(
		`SELECT * FROM mandates
		WHERE user_id = $1 AND archived_at IS NULL
		ORDER BY created_at DESC
		LIMIT 20`,
		[userId],
	);
}

/**
 * One mandate, by id and owner together. The owner is not decoration: without
 * it in the WHERE clause, an id from the browser would read anyone's mandate.
 */
export async function findMandate(id: string, userId: string) {
	const rows = await query<Mandate>(
		"SELECT * FROM mandates WHERE id = $1 AND user_id = $2",
		[id, userId],
	);

	return rows[0] ?? null;
}

export async function archiveMandate(id: string, userId: string) {
	await query(
		"UPDATE mandates SET archived_at = now() WHERE id = $1 AND user_id = $2",
		[id, userId],
	);
}
