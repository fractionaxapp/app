import "server-only";

import {
	listEnabledSources,
	recordRun,
	upsertOfferings,
	type Source,
} from "@/lib/db/sourcing";
import { extract, isAiConfigured } from "@/lib/ai";

import { fromJson, fromPayload, fromRss, textOf } from "./adapters";
import { fetchNextData } from "./nextdata";
import { fetchRwa } from "./rwa";
import { fetchDocument } from "./http";
import type { NormalisedOffering } from "./types";

/*
 * One crawl run.
 *
 * A source that fails does not fail the run: the error is written against that
 * source and the rest carry on. A venue being down is a normal Tuesday, and a
 * crawler that stops at the first one is a crawler that stops.
 */

export type RunResult = {
	source: string;
	status: "ok" | "error";
	stored?: number;
	withdrawn?: number;
	enriched?: number;
	error?: string;
};

/*
 * Feeds publish prose, not fields: a title and a paragraph, with the term and
 * the coupon written into the sentence. This reads them out — but only for
 * offerings the mapping could not fill in, and only up to a cap, because it is
 * one model call per offering and an unbounded crawl would be an unbounded
 * bill.
 *
 * Off unless the source asks for it, and that default was bought the hard way.
 * Run against an aggregator whose payload carries marketing copy, the model
 * returned a term and a seniority for a treasury money market fund — a product
 * that has neither — and "senior secured" on a fund share would have passed a
 * senior-secured-only mandate. The prompt says to omit what is not stated; the
 * blurb effectively states it.
 *
 * So the operator has to say that a source's prose actually describes terms,
 * by putting "extract": true in its mapping. Where that is not true, fields
 * stay null and show as unverifiable, which is the honest answer.
 */
const EXTRACT_LIMIT = 25;

const EXTRACT_SCHEMA = {
	type: "object",
	properties: {
		issuer: { type: "string" },
		assetClass: {
			type: "string",
			description: "e.g. private credit, real estate",
		},
		currency: { type: "string", description: "ISO code, e.g. USD" },
		netYield: { type: "number", description: "Percent. 9.2 means 9.2%." },
		termMonths: { type: "integer" },
		seniority: { type: "string", description: "e.g. senior secured" },
		minimum: {
			type: "number",
			description: "Minimum allocation, in the offering currency.",
		},
		jurisdiction: { type: "string" },
		dscr: { type: "number" },
	},
	additionalProperties: false,
} as const;

const EXTRACT_SYSTEM = [
	"You read one investment offering as a venue published it and record only",
	"the fields it actually states.",
	"",
	"Omit anything not stated. Do not convert an indicative range into a single",
	"number, do not infer a currency from a country, and do not estimate. A",
	"field you are unsure about must be left out: it will be shown to an",
	"investor as unverified, which is correct, whereas a guess would be shown",
	"as fact.",
].join("\n");

type Extracted = Partial<{
	issuer: string;
	assetClass: string;
	currency: string;
	netYield: number;
	termMonths: number;
	seniority: string;
	minimum: number;
	jurisdiction: string;
	dscr: number;
}>;

function needsEnrichment(offering: NormalisedOffering) {
	return (
		offering.netYield === null ||
		offering.netYield === undefined ||
		offering.termMonths === null ||
		offering.termMonths === undefined
	);
}

async function enrich(offerings: NormalisedOffering[], opted: boolean) {
	if (!opted || !isAiConfigured()) return 0;

	let used = 0;

	for (const offering of offerings) {
		if (used >= EXTRACT_LIMIT) break;
		if (!needsEnrichment(offering)) continue;

		const text = textOf(offering.raw);
		if (text.length < 40) continue;

		used += 1;

		const parsed = await extract<Extracted>({
			name: "record_offering_fields",
			description: "Record only the fields this offering states.",
			schema: EXTRACT_SCHEMA as unknown as Record<string, unknown>,
			system: EXTRACT_SYSTEM,
			prompt: `${offering.title}\n\n${text}`,
		});

		if (!parsed) continue;

		const fields = parsed.value;

		// The mapping wins wherever it produced a value: a field the venue
		// published in a structured form is better evidence than one read out
		// of its prose.
		offering.issuer ??= fields.issuer ?? null;
		offering.assetClass ??= fields.assetClass ?? null;
		offering.currency ??= fields.currency ?? null;
		offering.netYield ??= fields.netYield ?? null;
		offering.termMonths ??= fields.termMonths ?? null;
		offering.seniority ??= fields.seniority ?? null;
		offering.minimum ??= fields.minimum ?? null;
		offering.jurisdiction ??= fields.jurisdiction ?? null;
		offering.dscr ??= fields.dscr ?? null;
	}

	return used;
}

/** An operator-pinned build id, when the mapping carries one. */
function buildIdOf(source: Source) {
	const pinned = source.mapping.buildId;
	return typeof pinned === "string" && pinned.trim() ? pinned.trim() : null;
}

export async function crawlSource(source: Source): Promise<RunResult> {
	try {
		/*
		 * The dev reader finds its own URL — the venue's deploy hash is in it —
		 * so it does the fetching rather than being handed a document.
		 */
		const offerings =
			source.kind === "rwa"
				? await fetchRwa(buildIdOf(source))
				: source.kind === "nextdata"
					? fromPayload(
							await fetchNextData({
								page: source.url,
								buildId: buildIdOf(source),
							}),
							source.mapping,
						)
					: source.kind === "rss"
						? fromRss(await fetchDocument(source.url), source.mapping)
						: fromJson(await fetchDocument(source.url), source.mapping);

		if (offerings.length === 0) {
			await recordRun(source.id, { status: "ok", count: 0 });
			return { source: source.label, status: "ok", stored: 0, withdrawn: 0 };
		}

		const enriched = await enrich(offerings, source.mapping.extract === true);
		const { stored, withdrawn } = await upsertOfferings(source.id, offerings);

		await recordRun(source.id, { status: "ok", count: stored });

		return { source: source.label, status: "ok", stored, withdrawn, enriched };
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown failure";

		await recordRun(source.id, {
			status: "error",
			error: message.slice(0, 500),
		});

		return { source: source.label, status: "error", error: message };
	}
}

export async function crawlAll(): Promise<RunResult[]> {
	const sources = await listEnabledSources();

	const results: RunResult[] = [];

	// Sequential on purpose. These are other people's servers, and a handful of
	// venues hit at once from one address is how a crawler earns a block.
	for (const source of sources) {
		results.push(await crawlSource(source));
	}

	return results;
}
