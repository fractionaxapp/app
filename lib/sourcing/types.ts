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
	/*
	 * Trailing performance over the venue's own stated window. Separate from
	 * yield on purpose: a share that rose 37% over a year paid no coupon, and
	 * a mandate asking for income must not be answered with price movement.
	 */
	minReturn12m?: number;
	maxReturn12m?: number;
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
	"minReturn12m",
	"maxReturn12m",
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

	/* Everything else the venue publishes — see 0008_offering_detail.sql. */
	iconUrl?: string | null;
	symbol?: string | null;
	platform?: string | null;
	networks?: string[] | null;
	fundStructure?: string | null;
	subscriptionFrequency?: string | null;
	redemptionFrequency?: string | null;
	incomeTreatment?: string | null;
	investorTypes?: string[] | null;
	aum?: number | null;
	holdersCount?: number | null;
	managementFee?: number | null;
	performanceFee?: number | null;
	subscriptionFee?: number | null;
	redemptionFee?: number | null;
	inception?: string | null;
	description?: string | null;
	/** As reported, basis unstated. Never treated as a yield. */
	reportedReturn?: number | null;
	/* Trailing performance over stated windows. Returns, not income. */
	return1m?: number | null;
	return3m?: number | null;
	return12m?: number | null;

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
	icon_url: string | null;
	symbol: string | null;
	platform: string | null;
	networks: string[] | null;
	fund_structure: string | null;
	subscription_frequency: string | null;
	redemption_frequency: string | null;
	income_treatment: string | null;
	investor_types: string[] | null;
	aum: string | null;
	holders_count: number | null;
	management_fee: string | null;
	performance_fee: string | null;
	subscription_fee: string | null;
	redemption_fee: string | null;
	inception: string | null;
	description: string | null;
	reported_return: string | null;
	return_1m: string | null;
	return_3m: string | null;
	return_12m: string | null;
	first_seen: Date;
	last_seen: Date;
	withdrawn_at: Date | null;
};

export type Mandate = {
	id: string;
	user_id: string;
	statement: string;
	criteria: Criteria;
	parsed_by: "claude" | "minimax" | "rules";
	created_at: Date;
	archived_at: Date | null;
};
