import "server-only";

import { query } from "./client";

/*
 * Questions asked from the landing page. Written by an unauthenticated visitor
 * and read only by administrators, which makes this the one table in the
 * schema anyone on the internet can insert into — hence the recent-count check
 * below, and the length limits enforced before anything reaches it.
 */

export type EnquiryStatus = "new" | "handled";

export type Enquiry = {
	id: string;
	name: string;
	email: string;
	message: string;
	status: EnquiryStatus;
	handled_at: Date | null;
	handled_by: string | null;
	notified: boolean;
	ip: string | null;
	created_at: Date;
};

/*
 * `ip` is an inet column: a malformed value would abort the insert and lose the
 * message, which matters far more than knowing where it came from.
 */
function normaliseIp(value: string | null | undefined) {
	if (!value) return null;

	// x-forwarded-for is a comma-separated chain; the client is first.
	const candidate = value.split(",")[0]?.trim();
	if (!candidate) return null;

	return /^[0-9a-fA-F:.]+$/.test(candidate) ? candidate : null;
}

export async function createEnquiry(input: {
	name: string;
	email: string;
	message: string;
	ip?: string | null;
	userAgent?: string | null;
}) {
	const rows = await query<{ id: string }>(
		`INSERT INTO enquiries (name, email, message, ip, user_agent)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`,
		[
			input.name,
			input.email,
			input.message,
			normaliseIp(input.ip),
			input.userAgent ?? null,
		],
	);

	return rows[0].id;
}

/**
 * How many messages this address has sent in the last hour.
 *
 * Not a real rate limiter — it is a per-address count in the same database the
 * insert goes to, and anyone behind a different address is counted separately.
 * It exists so that one person holding down a button cannot fill the table,
 * which is the realistic failure, not a determined flood.
 */
export async function recentEnquiryCount(ip: string | null | undefined) {
	const address = normaliseIp(ip);
	if (!address) return 0;

	const rows = await query<{ n: string }>(
		`SELECT count(*)::text AS n FROM enquiries
		WHERE ip = $1 AND created_at > now() - interval '1 hour'`,
		[address],
	);

	return Number(rows[0].n);
}

export async function markNotified(id: string) {
	await query("UPDATE enquiries SET notified = true WHERE id = $1", [id]);
}

export async function listEnquiries({
	status = null,
	limit = 100,
}: { status?: EnquiryStatus | null; limit?: number } = {}) {
	return query<Enquiry>(
		`SELECT id, name, email, message, status, handled_at, handled_by,
			notified, host(ip) AS ip, created_at
		FROM enquiries
		WHERE ($1::text IS NULL OR status = $1)
		ORDER BY created_at DESC
		LIMIT $2`,
		[status, limit],
	);
}

export async function countNewEnquiries() {
	const rows = await query<{ n: string }>(
		"SELECT count(*)::text AS n FROM enquiries WHERE status = 'new'",
	);

	return Number(rows[0].n);
}

/** Returns false when the id does not exist, so the caller can say so. */
export async function setEnquiryStatus(
	id: string,
	next: EnquiryStatus,
	actorDid: string,
) {
	const rows = await query<{ id: string }>(
		`UPDATE enquiries SET
			status     = $2,
			handled_at = CASE WHEN $2 = 'handled' THEN now() ELSE NULL END,
			handled_by = CASE WHEN $2 = 'handled' THEN $3 ELSE NULL END
		WHERE id = $1
		RETURNING id`,
		[id, next, actorDid],
	);

	return rows.length > 0;
}
