import "server-only";

import type { Offering } from "@/lib/sourcing/types";

import { query } from "./client";

/*
 * Underwriting decisions: one row per account per offering, holding the
 * current position rather than a history. The note carries the reasoning,
 * which is the part worth keeping — a verdict on its own cannot be revisited.
 */

export type Verdict = "accepted" | "watching" | "rejected";

export type Decision = {
	offering_id: string;
	verdict: Verdict;
	note: string | null;
	updated_at: Date;
};

/** An offering with this account's decision on it, where one exists. */
export type Underwritable = Offering & {
	verdict: Verdict | null;
	note: string | null;
	decided_at: Date | null;
};

const COLUMNS = `
	o.id, o.source_id, s.label AS source_label, o.external_id, o.url, o.title,
	o.issuer, o.asset_class, o.currency, o.net_yield, o.term_months,
	o.seniority, o.minimum, o.jurisdiction, o.dscr,
	o.icon_url, o.symbol, o.platform, o.networks, o.fund_structure,
	o.subscription_frequency, o.redemption_frequency, o.income_treatment,
	o.investor_types, o.aum, o.holders_count, o.management_fee,
	o.performance_fee, o.subscription_fee, o.redemption_fee, o.inception,
	o.description, o.reported_return,
	o.first_seen, o.last_seen, o.withdrawn_at,
	u.verdict, u.note, u.updated_at AS decided_at
`;

/**
 * The queue.
 *
 * `state` is "open" for offerings this account has not decided on yet, a
 * verdict to see those, or null for everything. Withdrawn offerings stay
 * visible when they have been decided on — a rejected deal that has since
 * vanished is still part of the record.
 */
export async function listUnderwritable({
	userId,
	state = "open",
	search = "",
	limit = 25,
	offset = 0,
}: {
	userId: string;
	state?: string | null;
	search?: string;
	limit?: number;
	offset?: number;
}) {
	const where: string[] = [];
	const params: unknown[] = [userId];

	if (state === "open")
		where.push("u.verdict IS NULL AND o.withdrawn_at IS NULL");
	else if (state && state !== "all") {
		params.push(state);
		where.push(`u.verdict = $${params.length}`);
	}

	if (search.trim()) {
		params.push(`%${search.trim()}%`);
		const index = params.length;
		where.push(
			`(o.title ILIKE $${index} OR o.issuer ILIKE $${index} OR o.symbol ILIKE $${index})`,
		);
	}

	const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

	const rows = await query<Underwritable>(
		`SELECT ${COLUMNS}
		FROM offerings o
		JOIN sources s ON s.id = o.source_id
		LEFT JOIN underwriting u ON u.offering_id = o.id AND u.user_id = $1
		${clause}
		ORDER BY u.updated_at DESC NULLS LAST, o.last_seen DESC
		LIMIT ${Math.min(Math.max(1, limit), 100)} OFFSET ${Math.max(0, offset)}`,
		params,
	);

	const counted = await query<{ n: string }>(
		`SELECT count(*)::text AS n
		FROM offerings o
		LEFT JOIN underwriting u ON u.offering_id = o.id AND u.user_id = $1
		${clause}`,
		params,
	);

	return { rows, total: Number(counted[0]?.n ?? 0) };
}

export async function decisionCounts(userId: string) {
	const rows = await query<{ verdict: Verdict; n: string }>(
		"SELECT verdict, count(*)::text AS n FROM underwriting WHERE user_id = $1 GROUP BY verdict",
		[userId],
	);

	const counts = { accepted: 0, watching: 0, rejected: 0 };

	for (const row of rows) counts[row.verdict] = Number(row.n);

	return counts;
}

/** Record a verdict, replacing whatever this account decided before. */
export async function recordDecision(input: {
	userId: string;
	offeringId: string;
	verdict: Verdict;
	note: string | null;
}) {
	await query(
		`INSERT INTO underwriting (user_id, offering_id, verdict, note)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, offering_id) DO UPDATE SET
			verdict    = EXCLUDED.verdict,
			note       = EXCLUDED.note,
			updated_at = now()`,
		[input.userId, input.offeringId, input.verdict, input.note],
	);
}

export async function clearDecision(userId: string, offeringId: string) {
	await query(
		"DELETE FROM underwriting WHERE user_id = $1 AND offering_id = $2",
		[userId, offeringId],
	);
}
