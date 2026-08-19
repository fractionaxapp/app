import "server-only";

import { extract, isAiConfigured } from "@/lib/ai";

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
		assetClasses: clampList(input.assetClasses),
		seniority: clampList(input.seniority),
		jurisdictions: clampList(input.jurisdictions),
		currencies: clampList(input.currencies)?.map((entry) =>
			entry.toUpperCase(),
		),
		exclude: clampList(input.exclude),
	};

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

export type ParseResult = { criteria: Criteria; parsedBy: "claude" | "rules" };

/**
 * Parse a mandate, preferring the model and falling back to the rules. The
 * caller is told which ran so the screen can say so — a criterion nobody typed
 * needs to be attributable.
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

		if (parsed) return { criteria: sanitise(parsed), parsedBy: "claude" };
	}

	return { criteria: parseWithRules(trimmed), parsedBy: "rules" };
}
