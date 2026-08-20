import "server-only";

import { extract, isAiConfigured, type ProviderName } from "@/lib/ai";

import type { Criteria } from "./types";

/*
 * Turning a sentence into criteria.
 *
 * Two parsers, and the one that ran is recorded against the mandate. The model
 * reads what someone meant; the rules read what they literally wrote. The
 * rules are not a toy fallback — they are what runs when there is no API key,
 * and they are what the model's answer is validated against, because a parse
 * that invents a criterion nobody asked for is worse than one that misses.
 */

const SCHEMA = {
	type: "object",
	properties: {
		minYield: {
			type: "number",
			description: "Lowest acceptable net yield, in percent. 8 means 8%.",
		},
		maxYield: {
			type: "number",
			description: "Highest acceptable net yield, percent.",
		},
		minTermMonths: {
			type: "integer",
			description: "Shortest acceptable term, months.",
		},
		maxTermMonths: {
			type: "integer",
			description: "Longest acceptable term, months.",
		},
		maxMinimum: {
			type: "number",
			description:
				"Largest minimum allocation the investor will accept, in the offering currency.",
		},
		minDscr: {
			type: "number",
			description: "Lowest acceptable debt service coverage ratio, e.g. 1.5.",
		},
		minReturn12m: {
			type: "number",
			description:
				"Lowest acceptable trailing twelve-month return, in percent. This is past performance of the asset, NOT income: use it only when the mandate talks about how something has performed or risen, never for a yield or a coupon.",
		},
		maxReturn12m: {
			type: "number",
			description: "Highest acceptable trailing twelve-month return, percent.",
		},
		assetClasses: {
			type: "array",
			items: { type: "string" },
			description:
				"Asset classes asked for, lowercased, e.g. ['private credit', 'real estate'].",
		},
		seniority: {
			type: "array",
			items: { type: "string" },
			description: "Required seniority, e.g. ['senior secured'].",
		},
		jurisdictions: {
			type: "array",
			items: { type: "string" },
			description: "Countries or regions asked for.",
		},
		currencies: {
			type: "array",
			items: { type: "string" },
			description: "Currency codes asked for, uppercased, e.g. ['USD'].",
		},
		exclude: {
			type: "array",
			items: { type: "string" },
			description: "Things ruled out, as lowercase keywords.",
		},
	},
	additionalProperties: false,
} as const;

const SYSTEM = [
	"You read an investment mandate written in plain English and return only the",
	"constraints it actually states.",
	"",
	"Omit every field the mandate does not constrain. Do not infer a floor from",
	"an example, do not add a criterion because it is conventional, and do not",
	"guess at a number that was not given. A mandate that says nothing about",
	"jurisdiction has no jurisdiction constraint, and returning one would filter",
	"out deals the investor asked to see.",
	"",
	"`exclude` is only for things the mandate rules out — 'no crypto-backed",
	"deals', 'nothing in Russia'. Never put something there that the mandate",
	"asks for: excluding what was requested matches nothing at all.",
	"",
	"Income and performance are different fields and must not be swapped. A",
	"yield, a coupon or 'x% net' is minYield. How something has performed —",
	"'returned 30% over the last year', 'up 15%' — is minReturn12m. A share",
	"that rose 37% paid no coupon.",
].join("\n");

function clampNumber(value: unknown, min: number, max: number) {
	if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
	if (value < min || value > max) return undefined;
	return value;
}

function clampList(value: unknown, max = 12) {
	if (!Array.isArray(value)) return undefined;

	const list = value
		.filter((entry): entry is string => typeof entry === "string")
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean)
		.slice(0, max);

	return list.length > 0 ? list : undefined;
}

/*
 * Everything the model returns passes through here. The bounds are not
 * defensive nonsense — a yield of 900% or a term of 4,000 months is a
 * misreading, and letting one through would silently empty the results.
 */
function sanitise(input: Partial<Criteria>): Criteria {
	const criteria: Criteria = {
		minYield: clampNumber(input.minYield, 0, 100),
		maxYield: clampNumber(input.maxYield, 0, 100),
		minTermMonths: clampNumber(input.minTermMonths, 0, 600),
		maxTermMonths: clampNumber(input.maxTermMonths, 0, 600),
		maxMinimum: clampNumber(input.maxMinimum, 0, 1_000_000_000),
		minDscr: clampNumber(input.minDscr, 0, 100),
		// A twelve-month return can be negative, and often is.
		minReturn12m: clampNumber(input.minReturn12m, -100, 1000),
		maxReturn12m: clampNumber(input.maxReturn12m, -100, 1000),
		assetClasses: clampList(input.assetClasses),
		seniority: clampList(input.seniority),
		jurisdictions: clampList(input.jurisdictions),
		currencies: clampList(input.currencies)?.map((entry) =>
			entry.toUpperCase(),
		),
		exclude: clampList(input.exclude),
	};

	/*
	 * A term cannot be both asked for and ruled out. Models do produce this —
	 * "stocks that returned 30%" came back asking for stocks and excluding
	 * them — and the result matches nothing, silently. The exclusion loses:
	 * what the mandate asked for is the clearer signal.
	 */
	if (criteria.exclude) {
		const asked = new Set(
			[
				...(criteria.assetClasses ?? []),
				...(criteria.seniority ?? []),
				...(criteria.jurisdictions ?? []),
				...(criteria.currencies ?? []),
			].map((entry) => entry.toLowerCase()),
		);

		const kept = criteria.exclude.filter((word) => !asked.has(word));
		criteria.exclude = kept.length > 0 ? kept : undefined;
	}

	for (const key of Object.keys(criteria) as (keyof Criteria)[]) {
		if (criteria[key] === undefined) delete criteria[key];
	}

	return criteria;
}

const CURRENCIES = ["USD", "EUR", "GBP", "SGD", "AUD", "CHF", "JPY", "MYR"];

const ASSET_CLASSES = [
	"private credit",
	"real estate",
	"receivables",
	"trade finance",
	"infrastructure",
	"treasuries",
	"private equity",
	"venture",
	"royalties",
];

/** Reads amounts written as 25k, 25,000, $25000 or 1.5m. */
function money(text: string, pattern: RegExp) {
	const match = text.match(pattern);
	if (!match) return undefined;

	const raw = match[1].replace(/,/g, "");
	const amount = Number.parseFloat(raw);
	if (!Number.isFinite(amount)) return undefined;

	const suffix = (match[2] ?? "").toLowerCase();
	if (suffix === "k") return amount * 1_000;
	if (suffix === "m") return amount * 1_000_000;

	return amount;
}

/**
 * The parser that always works. Deliberately literal: it reads the numbers and
 * words that are there and nothing else.
 */
export function parseWithRules(statement: string): Criteria {
	const text = statement.toLowerCase();

	const yieldMatch = text.match(
		/(?:at least|minimum|min|above|over|>=?)\s*([\d.]+)\s*%/,
	);
	const yieldPlain = text.match(/([\d.]+)\s*%\s*(?:\+|or more|and above|plus)/);

	const termMatch = text.match(
		/(?:under|less than|within|up to|no longer than|max(?:imum)?)\s*([\d.]+)\s*(month|year)/,
	);

	const dscrMatch = text.match(
		/dscr\s*(?:of|above|over|at least|>=?)?\s*([\d.]+)/,
	);

	/*
	 * Only when the sentence says so. "8% net" is income; "up 20% over the last
	 * year" is performance, and reading one as the other is the mistake this
	 * field exists to avoid.
	 */
	const returnMatch = text.match(
		/(?:returned|return|performance|up|gained|grew)[^.\d]{0,24}([\d.]+)\s*%[^.]{0,24}(?:year|12 months|twelve months)/,
	);

	const raw: Partial<Criteria> = {
		minYield: yieldMatch
			? Number.parseFloat(yieldMatch[1])
			: yieldPlain
				? Number.parseFloat(yieldPlain[1])
				: undefined,

		maxTermMonths: termMatch
			? Math.round(
					Number.parseFloat(termMatch[1]) *
						(termMatch[2].startsWith("year") ? 12 : 1),
				)
			: undefined,

		maxMinimum: money(
			text,
			/(?:minimum|min|cheque|check|ticket|allocation)[^.\d]{0,20}\$?([\d,.]+)\s*([km])?/,
		),

		minDscr: dscrMatch ? Number.parseFloat(dscrMatch[1]) : undefined,

		minReturn12m: returnMatch ? Number.parseFloat(returnMatch[1]) : undefined,

		assetClasses: ASSET_CLASSES.filter((entry) => text.includes(entry)),

		seniority: ["senior secured", "senior", "mezzanine", "subordinated"].filter(
			(entry) => text.includes(entry),
		),

		currencies: CURRENCIES.filter((code) =>
			new RegExp(`\\b${code.toLowerCase()}\\b`).test(text),
		),
	};

	// "senior secured" also contains "senior"; keep only the most specific.
	if (raw.seniority?.includes("senior secured")) {
		raw.seniority = raw.seniority.filter((entry) => entry !== "senior");
	}

	return sanitise(raw);
}

export type ParsedBy = ProviderName | "rules";

export type ParseResult = { criteria: Criteria; parsedBy: ParsedBy };

/**
 * Parse a mandate, preferring the model and falling back to the rules.
 *
 * The caller is told which one ran — including which provider, when more than
 * one is configured. A criterion nobody typed needs to be attributable to the
 * thing that invented it.
 */
export async function parseMandate(statement: string): Promise<ParseResult> {
	const trimmed = statement.trim().slice(0, 2000);

	if (isAiConfigured()) {
		const parsed = await extract<Partial<Criteria>>({
			name: "record_mandate_criteria",
			description:
				"Record only the constraints the mandate states. Omit everything else.",
			schema: SCHEMA as unknown as Record<string, unknown>,
			system: SYSTEM,
			prompt: trimmed,
		});

		if (parsed) {
			return { criteria: sanitise(parsed.value), parsedBy: parsed.provider };
		}
	}

	return { criteria: parseWithRules(trimmed), parsedBy: "rules" };
}
