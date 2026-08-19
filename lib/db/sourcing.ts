import "server-only";

import type {
	Criteria,
	Mandate,
	NormalisedOffering,
	Offering,
} from "@/lib/sourcing/types";

import { query, transaction } from "./client";

export type SourceKind = "json" | "rss" | "rwa";

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
export async function upsertOfferings(
	sourceId: string,
	offerings: NormalisedOffering[],
) {
	return transaction(async (client) => {
		const seen: string[] = [];

		for (const offering of offerings) {
			await client.query(
				`INSERT INTO offerings (
					source_id, external_id, url, title, issuer, asset_class, currency,
					net_yield, term_months, seniority, minimum, jurisdiction, dscr, raw
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
				ON CONFLICT (source_id, external_id) DO UPDATE SET
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
					raw          = EXCLUDED.raw,
					last_seen    = now(),
					-- Back from the dead: a re-listed offering is live again.
					withdrawn_at = NULL`,
				[
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
					JSON.stringify(offering.raw ?? {}),
				],
			);

			seen.push(offering.externalId);
		}

		const { rowCount } = await client.query(
			`UPDATE offerings SET withdrawn_at = now()
			WHERE source_id = $1
				AND withdrawn_at IS NULL
				AND NOT (external_id = ANY($2::text[]))`,
			[sourceId, seen],
		);

		return { stored: seen.length, withdrawn: rowCount ?? 0 };
	});
}

const OFFERING_COLUMNS = `
	o.id, o.source_id, s.label AS source_label, o.external_id, o.url, o.title,
	o.issuer, o.asset_class, o.currency, o.net_yield, o.term_months,
	o.seniority, o.minimum, o.jurisdiction, o.dscr, o.first_seen, o.last_seen,
	o.withdrawn_at
`;

/** Everything still listed, for the matcher to run over. */
export async function listLiveOfferings(limit = 1000) {
	return query<Offering>(
		`SELECT ${OFFERING_COLUMNS}
		FROM offerings o JOIN sources s ON s.id = o.source_id
		WHERE o.withdrawn_at IS NULL
		ORDER BY o.net_yield DESC NULLS LAST
		LIMIT $1`,
		[limit],
	);
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
	parsedBy: "claude" | "rules";
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
