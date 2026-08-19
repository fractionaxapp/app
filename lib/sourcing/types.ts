/*
 * Shared shapes for deal sourcing. No imports, no "server-only": the criteria
 * type is rendered on the client as well as matched against on the server.
 */

/** What a mandate asks for. Every field is optional; an absent one is not a test. */
export type Criteria = {
	/** Percent, e.g. 8 for "at least 8%". */
	minYield?: number;
	maxYield?: number;
	minTermMonths?: number;
	maxTermMonths?: number;
	/** The largest cheque the account is willing to be asked for. */
	maxMinimum?: number;
	minDscr?: number;
	assetClasses?: string[];
	seniority?: string[];
	jurisdictions?: string[];
	currencies?: string[];
	/** Offerings whose text contains any of these are excluded outright. */
	exclude?: string[];
};

export const CRITERIA_KEYS: (keyof Criteria)[] = [
	"minYield",
	"maxYield",
	"minTermMonths",
	"maxTermMonths",
	"maxMinimum",
	"minDscr",
	"assetClasses",
	"seniority",
	"jurisdictions",
	"currencies",
	"exclude",
];

/** One offering as the crawler hands it over, before it reaches Postgres. */
export type NormalisedOffering = {
	externalId: string;
	title: string;
	url?: string | null;
	issuer?: string | null;
	assetClass?: string | null;
	currency?: string | null;
	netYield?: number | null;
	termMonths?: number | null;
	seniority?: string | null;
	minimum?: number | null;
	jurisdiction?: string | null;
	dscr?: number | null;
	raw: unknown;
};

export type Offering = {
	id: string;
	source_id: string;
	source_label: string;
	external_id: string;
	url: string | null;
	title: string;
	issuer: string | null;
	asset_class: string | null;
	currency: string | null;
	net_yield: string | null;
	term_months: number | null;
	seniority: string | null;
	minimum: string | null;
	jurisdiction: string | null;
	dscr: string | null;
	first_seen: Date;
	last_seen: Date;
	withdrawn_at: Date | null;
};

export type Mandate = {
	id: string;
	user_id: string;
	statement: string;
	criteria: Criteria;
	parsed_by: "claude" | "rules";
	created_at: Date;
	archived_at: Date | null;
};
