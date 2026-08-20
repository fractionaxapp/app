import "server-only";

import { XMLParser } from "fast-xml-parser";

import type { NormalisedOffering } from "./types";

/*
 * Turning what a venue publishes into rows we can compare.
 *
 * Two adapters ship: a JSON one driven by a field mapping, and a feed one for
 * RSS/Atom. Neither knows anything about a particular venue — the mapping is
 * configuration, held in the sources table, so adding a venue that publishes
 * JSON is a row rather than a deploy.
 *
 * A venue that publishes neither needs a parser written against its markup,
 * and that is a per-venue job: selectors invented without seeing the page are
 * guesses, and a guess here silently produces wrong numbers rather than an
 * error, which is the worst way for this to fail.
 */

type Mapping = Record<string, unknown>;

/** Resolve "terms.apy" or "items.0.id" against a parsed payload. */
function pick(source: unknown, path: string | undefined): unknown {
	if (!path) return undefined;

	return path.split(".").reduce<unknown>((value, segment) => {
		if (value === null || value === undefined) return undefined;
		if (Array.isArray(value)) return value[Number(segment)];
		if (typeof value === "object")
			return (value as Record<string, unknown>)[segment];
		return undefined;
	}, source);
}

function mappedPath(mapping: Mapping, field: string, fallbacks: string[]) {
	const configured = mapping[field];
	if (typeof configured === "string" && configured) return configured;

	return [field, ...fallbacks];
}

/** Try the configured path, then a few names venues commonly use. */
function value(
	item: unknown,
	mapping: Mapping,
	field: string,
	...aliases: string[]
) {
	const paths = mappedPath(mapping, field, aliases);

	for (const path of Array.isArray(paths) ? paths : [paths]) {
		const found = pick(item, path);
		if (found !== undefined && found !== null && found !== "") return found;
	}

	return undefined;
}

/** A list of short labels — chains, investor types — however the venue nests them. */
function toList(input: unknown): string[] | null {
	if (!Array.isArray(input)) return null;

	const list = input
		.map((entry) => {
			if (typeof entry === "string") return entry.trim();
			if (entry && typeof entry === "object") {
				const name = (entry as { name?: unknown }).name;
				if (typeof name === "string") return name.trim();
			}
			return "";
		})
		.filter(Boolean);

	return list.length > 0 ? list : null;
}

function toInteger(input: unknown): number | null {
	const value = toNumber(input);
	return value === null ? null : Math.round(value);
}

function toText(input: unknown): string | null {
	if (input === null || input === undefined) return null;
	if (typeof input === "string") return input.trim() || null;
	if (typeof input === "number" || typeof input === "boolean")
		return String(input);
	return null;
}

/*
 * Venues write numbers as "9.2%", "$25,000" and "1.80x" as readily as they
 * write 9.2. Anything that still will not parse becomes null, which the
 * matcher reports as unverifiable rather than quietly treating as zero — the
 * difference between "we could not check" and "it failed".
 */
function toNumber(input: unknown): number | null {
	if (typeof input === "number") return Number.isFinite(input) ? input : null;
	if (typeof input !== "string") return null;

	const cleaned = input.replace(/[^0-9.\-]/g, "");
	if (!cleaned || cleaned === "-" || cleaned === ".") return null;

	const parsed = Number.parseFloat(cleaned);
	return Number.isFinite(parsed) ? parsed : null;
}

/** "24", "24 months", "2 years" and "2y" all mean a number of months. */
function toMonths(input: unknown): number | null {
	const raw = toNumber(input);
	if (raw === null) return null;

	if (typeof input === "string" && /year|yr\b|\dy\b/i.test(input)) {
		return Math.round(raw * 12);
	}

	return Math.round(raw);
}

function offeringFrom(
	item: unknown,
	mapping: Mapping,
	index: number,
): NormalisedOffering | null {
	const title = toText(value(item, mapping, "title", "name", "deal_name"));
	if (!title) return null;

	const externalId =
		toText(value(item, mapping, "externalId", "id", "uuid", "slug", "guid")) ??
		// No identifier of their own: fall back to the link, then to position,
		// which at least keeps a re-crawl from duplicating every row.
		toText(value(item, mapping, "url", "link", "href")) ??
		`index-${index}`;

	return {
		externalId,
		title,
		url: toText(value(item, mapping, "url", "link", "href")),
		issuer: toText(value(item, mapping, "issuer", "sponsor", "borrower")),
		assetClass: toText(
			value(item, mapping, "assetClass", "asset_class", "category", "type"),
		),
		currency: toText(value(item, mapping, "currency", "ccy")),
		netYield: toNumber(
			value(
				item,
				mapping,
				"netYield",
				"net_yield",
				"yield",
				"apy",
				"apr",
				"rate",
			),
		),
		termMonths: toMonths(
			value(item, mapping, "termMonths", "term_months", "term", "duration"),
		),
		seniority: toText(value(item, mapping, "seniority", "rank", "tranche")),
		minimum: toNumber(
			value(item, mapping, "minimum", "min_investment", "minimum_investment"),
		),
		jurisdiction: toText(
			value(item, mapping, "jurisdiction", "country", "domicile"),
		),
		dscr: toNumber(
			value(item, mapping, "dscr", "coverage", "debt_service_coverage"),
		),

		symbol: toText(value(item, mapping, "symbol", "ticker", "code")),
		platform: toText(value(item, mapping, "platform", "venue", "marketplace")),
		networks: toList(value(item, mapping, "networks", "chains", "blockchains")),
		fundStructure: toText(
			value(item, mapping, "fundStructure", "fund_structure", "structure"),
		),
		subscriptionFrequency: toText(
			value(item, mapping, "subscriptionFrequency", "subscription_frequency"),
		),
		redemptionFrequency: toText(
			value(item, mapping, "redemptionFrequency", "redemption_frequency"),
		),
		incomeTreatment: toText(
			value(item, mapping, "incomeTreatment", "income_treatment"),
		),
		investorTypes: toList(
			value(item, mapping, "investorTypes", "investor_types", "eligibility"),
		),
		aum: toNumber(
			value(item, mapping, "aum", "assets_under_management", "tvl"),
		),
		holdersCount: toInteger(
			value(item, mapping, "holdersCount", "holders_count", "holders"),
		),
		managementFee: toNumber(
			value(item, mapping, "managementFee", "management_fee", "fee"),
		),
		performanceFee: toNumber(
			value(item, mapping, "performanceFee", "performance_fee"),
		),
		subscriptionFee: toNumber(
			value(item, mapping, "subscriptionFee", "subscription_fee"),
		),
		redemptionFee: toNumber(
			value(item, mapping, "redemptionFee", "redemption_fee"),
		),
		inception: toText(value(item, mapping, "inception", "launched", "start")),
		description: toText(
			value(item, mapping, "description", "summary", "blurb"),
		),
		/*
		 * Never mapped onto netYield, however tempting the field name is: a
		 * return with no stated basis is not a yield, and the difference matters
		 * to whoever is shown the number.
		 */
		reportedReturn: toNumber(
			value(item, mapping, "reportedReturn", "reported_return", "return"),
		),

		raw: item,
	} satisfies NormalisedOffering;
}

export function fromJson(body: string, mapping: Mapping): NormalisedOffering[] {
	let payload: unknown;

	try {
		payload = JSON.parse(body);
	} catch {
		throw new Error("response was not valid JSON");
	}

	return fromPayload(payload, mapping);
}

/** The mapping half, for callers that already hold a parsed payload. */
export function fromPayload(
	payload: unknown,
	mapping: Mapping,
): NormalisedOffering[] {
	const itemsPath =
		typeof mapping.items === "string" ? mapping.items : undefined;

	const candidate = itemsPath ? pick(payload, itemsPath) : payload;

	const items = Array.isArray(candidate)
		? candidate
		: Array.isArray((candidate as { data?: unknown })?.data)
			? (candidate as { data: unknown[] }).data
			: Array.isArray((candidate as { items?: unknown })?.items)
				? (candidate as { items: unknown[] }).items
				: null;

	if (!items) {
		throw new Error(
			itemsPath
				? `no array at "${itemsPath}"`
				: "could not find an array of offerings — set mapping.items",
		);
	}

	return items
		.map((item, index) => offeringFrom(item, mapping, index))
		.filter((offering): offering is NormalisedOffering => offering !== null);
}

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@",
	trimValues: true,
});

/** RSS 2.0 and Atom both, since venues use whichever their CMS emits. */
export function fromRss(body: string, mapping: Mapping): NormalisedOffering[] {
	let payload: Record<string, unknown>;

	try {
		payload = parser.parse(body) as Record<string, unknown>;
	} catch {
		throw new Error("response was not valid XML");
	}

	const channel = pick(payload, "rss.channel");
	const rssItems = pick(channel, "item");
	const atomItems = pick(payload, "feed.entry");

	const raw = rssItems ?? atomItems;
	if (!raw) throw new Error("no <item> or <entry> elements found");

	const items = Array.isArray(raw) ? raw : [raw];

	return items
		.map((item, index): NormalisedOffering | null => {
			const normalised = offeringFrom(item, mapping, index);
			if (!normalised) return null;

			// Atom puts the address on an attribute rather than in the element.
			if (!normalised.url) {
				const href = pick(item, "link.@href");
				normalised.url = toText(href);
			}

			return normalised;
		})
		.filter((offering): offering is NormalisedOffering => offering !== null);
}

/** Everything a feed says about one offering, for the extractor to read. */
export function textOf(raw: unknown): string {
	if (typeof raw === "string") return raw;
	if (!raw || typeof raw !== "object") return "";

	const parts: string[] = [];

	for (const [key, item] of Object.entries(raw as Record<string, unknown>)) {
		if (key.startsWith("@")) continue;
		if (typeof item === "string" || typeof item === "number") {
			parts.push(`${key}: ${item}`);
		}
	}

	return parts.join("\n").slice(0, 4000);
}
