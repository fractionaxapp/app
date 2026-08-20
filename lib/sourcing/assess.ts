import type { Offering } from "./types";

/*
 * What can and cannot be underwritten from what a venue published.
 *
 * This does not underwrite anything. It has no view on whether a deal is good,
 * because nothing it can read supports one: there are no offering documents
 * here, no payment history, no covenant tests — only the fields a venue chose
 * to publish about itself.
 *
 * What it can do honestly is say what is missing. An allocator's first job on
 * a new name is working out whether there is enough on the table to form a
 * view at all, and that is a question this data answers exactly.
 */

export type Severity = "blocking" | "note";

export type Flag = {
	label: string;
	detail: string;
	severity: Severity;
};

/** The fields a credit view would be built from, and what to call them. */
const NEEDED: { key: keyof Offering; label: string }[] = [
	{ key: "net_yield", label: "Net yield" },
	{ key: "term_months", label: "Term" },
	{ key: "seniority", label: "Seniority" },
	{ key: "dscr", label: "Coverage" },
	{ key: "minimum", label: "Minimum" },
	{ key: "currency", label: "Currency" },
	{ key: "jurisdiction", label: "Jurisdiction" },
	{ key: "fund_structure", label: "Legal form" },
	{ key: "investor_types", label: "Eligibility" },
	{ key: "management_fee", label: "Management fee" },
	{ key: "inception", label: "Inception" },
	{ key: "description", label: "Description" },
];

/** Days after which a listing is old enough that its terms may have moved. */
const STALE_AFTER = 14;

export type Assessment = {
	/** Fields present, out of the ones a credit view needs. */
	published: number;
	total: number;
	missing: string[];
	flags: Flag[];
	/** True when nothing blocking stands in the way of forming a view. */
	underwritable: boolean;
};

function has(offering: Offering, key: keyof Offering) {
	const value = offering[key];

	if (value === null || value === undefined) return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "string") return value.trim() !== "";

	return true;
}

export function assess(offering: Offering, now = Date.now()): Assessment {
	const missing = NEEDED.filter((field) => !has(offering, field.key)).map(
		(field) => field.label,
	);

	const flags: Flag[] = [];

	/*
	 * Blocking flags are the ones that stop a view being formed at all. A deal
	 * with no yield and no term is not a bad deal — it is a deal nobody outside
	 * the issuer can price, which is a different and more useful thing to say.
	 */
	if (!has(offering, "net_yield")) {
		flags.push({
			label: "No yield published",
			detail: "Nothing to price the position against.",
			severity: "blocking",
		});
	}

	if (!has(offering, "term_months")) {
		flags.push({
			label: "No term published",
			detail:
				"Open-ended, or simply unstated — the venue does not say which, and they are not the same risk.",
			severity: "blocking",
		});
	}

	if (!has(offering, "seniority")) {
		flags.push({
			label: "Seniority unstated",
			detail: "Where this sits if the issuer fails is not published.",
			severity: "note",
		});
	}

	if (!has(offering, "dscr")) {
		flags.push({
			label: "No coverage ratio",
			detail: "No headroom figure to test against a covenant.",
			severity: "note",
		});
	}

	if (offering.reported_return !== null) {
		flags.push({
			label: "Return reported without a basis",
			detail:
				"The venue publishes a return but never says over what period, so it cannot be compared with anything.",
			severity: "note",
		});
	}

	const fees = [
		offering.management_fee,
		offering.performance_fee,
		offering.subscription_fee,
		offering.redemption_fee,
	].some((fee) => fee !== null);

	if (fees) {
		flags.push({
			label: "Fees in an unstated unit",
			detail:
				"Published as bare numbers. Consistent with basis points across this source, but not stated, so a net figure cannot be computed.",
			severity: "note",
		});
	}

	if (!has(offering, "investor_types")) {
		flags.push({
			label: "Eligibility unstated",
			detail: "Who may hold this is not published.",
			severity: "note",
		});
	}

	if (offering.withdrawn_at) {
		flags.push({
			label: "Withdrawn",
			detail: "No longer listed at the venue.",
			severity: "blocking",
		});
	} else {
		const days = Math.floor((now - offering.last_seen.getTime()) / 86_400_000);

		if (days >= STALE_AFTER) {
			flags.push({
				label: `Not seen for ${days} days`,
				detail: "The terms shown may have moved since the last crawl.",
				severity: "note",
			});
		}
	}

	return {
		published: NEEDED.length - missing.length,
		total: NEEDED.length,
		missing,
		flags,
		underwritable: !flags.some((flag) => flag.severity === "blocking"),
	};
}
