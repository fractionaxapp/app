import "server-only";

import type { Offering } from "@/lib/sourcing/types";

import { query } from "./client";

/*
 * Policy limits, and the allocations an account intends or has made.
 *
 * The limits are the point. An allocation that breaches one is refused before
 * it is recorded, with the reason, which is the only part of "the agent
 * cannot exceed your limits" this product can honestly do today: there is no
 * custody here and no venue API, so nothing settles by itself.
 */

export type Policy = {
	max_per_allocation: string | null;
	max_total: string | null;
	currency: string;
	updated_at: Date;
};

export type AllocationStatus = "planned" | "executed" | "cancelled";

export type Allocation = {
	id: string;
	offering_id: string;
	amount: string;
	currency: string;
	status: AllocationStatus;
	reference: string | null;
	note: string | null;
	created_at: Date;
	executed_at: Date | null;
};

export type AllocationRow = Allocation & {
	title: string;
	symbol: string | null;
	issuer: string | null;
	icon_url: string | null;
	url: string | null;
	minimum: string | null;
	offering_currency: string | null;
	withdrawn_at: Date | null;
};

export async function findPolicy(userId: string) {
	const rows = await query<Policy>(
		"SELECT max_per_allocation, max_total, currency, updated_at FROM policies WHERE user_id = $1",
		[userId],
	);

	return rows[0] ?? null;
}

export async function savePolicy(input: {
	userId: string;
	maxPerAllocation: number | null;
	maxTotal: number | null;
	currency: string;
}) {
	await query(
		`INSERT INTO policies (user_id, max_per_allocation, max_total, currency)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE SET
			max_per_allocation = EXCLUDED.max_per_allocation,
			max_total          = EXCLUDED.max_total,
			currency           = EXCLUDED.currency,
			updated_at         = now()`,
		[input.userId, input.maxPerAllocation, input.maxTotal, input.currency],
	);
}

/** Offerings this account accepted at underwriting and has not allocated to. */
export async function listAcceptedForExecution(userId: string, limit = 50) {
	return query<Offering & { note: string | null }>(
		`SELECT
			o.id, o.source_id, s.label AS source_label, o.external_id, o.url, o.title,
			o.issuer, o.asset_class, o.currency, o.net_yield, o.term_months,
			o.seniority, o.minimum, o.jurisdiction, o.dscr, o.icon_url, o.symbol,
			o.platform, o.networks, o.fund_structure, o.subscription_frequency,
			o.redemption_frequency, o.income_treatment, o.investor_types, o.aum,
			o.holders_count, o.management_fee, o.performance_fee, o.subscription_fee,
			o.redemption_fee, o.inception, o.description, o.reported_return,
			o.first_seen, o.last_seen, o.withdrawn_at, u.note
		FROM underwriting u
		JOIN offerings o ON o.id = u.offering_id
		JOIN sources s ON s.id = o.source_id
		WHERE u.user_id = $1
			AND u.verdict = 'accepted'
			AND NOT EXISTS (
				SELECT 1 FROM allocations a
				WHERE a.user_id = u.user_id
					AND a.offering_id = u.offering_id
					AND a.status <> 'cancelled'
			)
		ORDER BY u.updated_at DESC
		LIMIT $2`,
		[userId, limit],
	);
}

export async function listAllocations(userId: string) {
	return query<AllocationRow>(
		`SELECT a.id, a.offering_id, a.amount, a.currency, a.status, a.reference,
			a.note, a.created_at, a.executed_at,
			o.title, o.symbol, o.issuer, o.icon_url, o.url, o.minimum,
			o.currency AS offering_currency, o.withdrawn_at
		FROM allocations a
		JOIN offerings o ON o.id = a.offering_id
		WHERE a.user_id = $1
		ORDER BY
			CASE a.status WHEN 'planned' THEN 0 WHEN 'executed' THEN 1 ELSE 2 END,
			a.updated_at DESC`,
		[userId],
	);
}

/** Committed and intended, which is what the total limit is measured against. */
export async function committed(userId: string) {
	const rows = await query<{ planned: string; executed: string }>(
		`SELECT
			coalesce(sum(amount) FILTER (WHERE status = 'planned'), 0)::text AS planned,
			coalesce(sum(amount) FILTER (WHERE status = 'executed'), 0)::text AS executed
		FROM allocations WHERE user_id = $1`,
		[userId],
	);

	return {
		planned: Number(rows[0]?.planned ?? 0),
		executed: Number(rows[0]?.executed ?? 0),
	};
}

export async function createAllocation(input: {
	userId: string;
	offeringId: string;
	amount: number;
	currency: string;
	note: string | null;
}) {
	await query(
		`INSERT INTO allocations (user_id, offering_id, amount, currency, note)
		VALUES ($1, $2, $3, $4, $5)`,
		[input.userId, input.offeringId, input.amount, input.currency, input.note],
	);
}

export async function setAllocationStatus(input: {
	userId: string;
	id: string;
	status: AllocationStatus;
	reference: string | null;
}) {
	await query(
		`UPDATE allocations SET
			status      = $3,
			reference   = coalesce($4, reference),
			executed_at = CASE WHEN $3 = 'executed' THEN now() ELSE NULL END,
			updated_at  = now()
		WHERE id = $2 AND user_id = $1`,
		[input.userId, input.id, input.status, input.reference],
	);
}
