import type { Criteria, Offering } from "./types";

/*
 * Matching an offering against a mandate.
 *
 * Three outcomes, not a score. A number between 0 and 1 would let a deal that
 * fails the one criterion the investor cared about outrank one that meets
 * everything, and there is no weighting that fixes that in general — so a
 * stated criterion is a requirement, and failing one is disqualifying.
 *
 * The third outcome is the important one. A venue that does not publish a DSCR
 * cannot be said to pass a DSCR test or to fail it, and quietly dropping those
 * offerings would hide exactly the deals worth a phone call. They are set
 * aside as unverifiable, with the missing field named.
 */

export type Verdict = "pass" | "fail" | "unknown";

export type Check = {
	label: string;
	verdict: Verdict;
	detail: string;
};

export type Status = "match" | "excluded" | "unverifiable";

export type Match = {
	offering: Offering;
	checks: Check[];
	status: Status;
};

function number(value: string | null) {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

const percent = (value: number) => `${value}%`;
const months = (value: number) =>
	value % 12 === 0 ? `${value / 12} years` : `${value} months`;

function listCheck(
	label: string,
	wanted: string[] | undefined,
	actual: string | null,
): Check | null {
	if (!wanted?.length) return null;

	const readable = wanted.join(", ");

	if (actual === null) {
		return {
			label,
			verdict: "unknown",
			detail: `not published — mandate asks for ${readable}`,
		};
	}

	const haystack = actual.toLowerCase();
	const hit = wanted.some((entry) => haystack.includes(entry.toLowerCase()));

	return {
		label,
		verdict: hit ? "pass" : "fail",
		detail: hit ? actual : `${actual}, not ${readable}`,
	};
}

function boundCheck(
	label: string,
	actual: number | null,
	format: (value: number) => string,
	bound: { min?: number; max?: number },
): Check | null {
	if (bound.min === undefined && bound.max === undefined) return null;

	const wanted = [
		bound.min !== undefined ? `at least ${format(bound.min)}` : null,
		bound.max !== undefined ? `at most ${format(bound.max)}` : null,
	]
		.filter(Boolean)
		.join(" and ");

	if (actual === null) {
		return {
			label,
			verdict: "unknown",
			detail: `not published — mandate wants ${wanted}`,
		};
	}

	const tooLow = bound.min !== undefined && actual < bound.min;
	const tooHigh = bound.max !== undefined && actual > bound.max;

	return {
		label,
		verdict: tooLow || tooHigh ? "fail" : "pass",
		detail:
			tooLow || tooHigh
				? `${format(actual)}, wanted ${wanted}`
				: format(actual),
	};
}

export function checkOffering(offering: Offering, criteria: Criteria): Match {
	const checks: Check[] = [];

	const push = (check: Check | null) => {
		if (check) checks.push(check);
	};

	push(
		boundCheck("Net yield", number(offering.net_yield), percent, {
			min: criteria.minYield,
			max: criteria.maxYield,
		}),
	);

	push(
		boundCheck("Term", offering.term_months, months, {
			min: criteria.minTermMonths,
			max: criteria.maxTermMonths,
		}),
	);

	push(
		boundCheck(
			"Minimum",
			number(offering.minimum),
			(value) => value.toLocaleString("en-GB"),
			{ max: criteria.maxMinimum },
		),
	);

	push(
		boundCheck("DSCR", number(offering.dscr), (value) => `${value}×`, {
			min: criteria.minDscr,
		}),
	);

	push(listCheck("Asset class", criteria.assetClasses, offering.asset_class));
	push(listCheck("Seniority", criteria.seniority, offering.seniority));
	push(
		listCheck("Jurisdiction", criteria.jurisdictions, offering.jurisdiction),
	);
	push(listCheck("Currency", criteria.currencies, offering.currency));

	if (criteria.exclude?.length) {
		const haystack = [offering.title, offering.issuer, offering.asset_class]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		const hit = criteria.exclude.find((word) => haystack.includes(word));

		checks.push({
			label: "Exclusions",
			verdict: hit ? "fail" : "pass",
			detail: hit ? `mentions "${hit}"` : "none matched",
		});
	}

	const status: Status = checks.some((check) => check.verdict === "fail")
		? "excluded"
		: checks.some((check) => check.verdict === "unknown")
			? "unverifiable"
			: "match";

	return { offering, checks, status };
}

/**
 * Run a mandate over the index.
 *
 * Matches are ranked by yield, highest first, with offerings that publish no
 * yield last — not because they are worse, but because there is nothing to
 * rank them by, and putting them first would be an accident of null sorting.
 */
export function runMandate(offerings: Offering[], criteria: Criteria) {
	const results = offerings.map((offering) =>
		checkOffering(offering, criteria),
	);

	const byYield = (a: Match, b: Match) => {
		const left = number(a.offering.net_yield);
		const right = number(b.offering.net_yield);

		if (left === null && right === null) return 0;
		if (left === null) return 1;
		if (right === null) return -1;
		return right - left;
	};

	return {
		matched: results.filter((r) => r.status === "match").sort(byYield),
		unverifiable: results
			.filter((r) => r.status === "unverifiable")
			.sort(byYield),
		excluded: results.filter((r) => r.status === "excluded").sort(byYield),
	};
}
