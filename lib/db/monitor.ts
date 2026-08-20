import "server-only";

import type { Offering } from "@/lib/sourcing/types";

import { query } from "./client";

/*
 * What an account is following, and what has moved under it.
 *
 * Following means one of two things: money is committed to it, or it was set
 * aside to watch at underwriting. Both deserve the same treatment — the second
 * is where a deal sits precisely because something about it needed checking
 * later.
 */

export type Followed = Offering & {
	/** Why it is being watched, and since when. */
	kind: "allocation" | "watchlist";
	since: Date;
	amount: string | null;
	allocation_currency: string | null;
	status: string | null;
	note: string | null;
	days_unseen: number;
};

export type Change = {
	offering_id: string;
	field: string;
	before: string | null;
	after: string | null;
	changed_at: Date;
};

const COLUMNS = `
	o.id, o.source_id, s.label AS source_label, o.external_id, o.url, o.title,
	o.issuer, o.asset_class, o.currency, o.net_yield, o.term_months,
	o.seniority, o.minimum, o.jurisdiction, o.dscr, o.icon_url, o.symbol,
	o.platform, o.networks, o.fund_structure, o.subscription_frequency,
	o.redemption_frequency, o.income_treatment, o.investor_types, o.aum,
	o.holders_count, o.management_fee, o.performance_fee, o.subscription_fee,
	o.redemption_fee, o.inception, o.description, o.reported_return,
	o.first_seen, o.last_seen, o.withdrawn_at
`;

export async function listFollowed(userId: string) {
	return query<Followed>(
		`SELECT ${COLUMNS},
			'allocation' AS kind, a.created_at AS since, a.amount,
			a.currency AS allocation_currency, a.status, a.note
		FROM allocations a
		JOIN offerings o ON o.id = a.offering_id
		JOIN sources s ON s.id = o.source_id
		WHERE a.user_id = $1 AND a.status <> 'cancelled'

		UNION ALL

		SELECT ${COLUMNS},
			'watchlist' AS kind, u.updated_at AS since, NULL, NULL, NULL, u.note
		FROM underwriting u
		JOIN offerings o ON o.id = u.offering_id
		JOIN sources s ON s.id = o.source_id
		WHERE u.user_id = $1
			AND u.verdict = 'watching'
			AND NOT EXISTS (
				SELECT 1 FROM allocations a
				WHERE a.user_id = u.user_id
					AND a.offering_id = u.offering_id
					AND a.status <> 'cancelled'
			)

		ORDER BY since DESC`,
		[userId],
	);
}

/**
 * Every recorded change for a set of offerings.
 *
 * Fetched in one query and grouped in the caller: the interesting cut is "what
 * has moved since I took this position", and each position has its own since.
 */
export async function changesFor(offeringIds: string[], limit = 500) {
	if (offeringIds.length === 0) return [];

	return query<Change>(
		`SELECT offering_id, field, before, after, changed_at
		FROM offering_changes
		WHERE offering_id = ANY($1::uuid[])
		ORDER BY changed_at DESC
		LIMIT ${Math.min(Math.max(1, limit), 2000)}`,
		[offeringIds],
	);
}
