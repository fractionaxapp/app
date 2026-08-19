import "server-only";

import { fetchDocument } from "./http";
import type { NormalisedOffering } from "./types";

/*
 * A development-only reader for rwa.xyz's asset screener.
 *
 * This does not use a published API. It reads the payload the site's own page
 * loads, which means three things worth stating plainly rather than burying:
 *
 *   1. The URL contains their deploy hash, so it changes every time they ship.
 *      That is why the build id is discovered per run instead of configured —
 *      a hash in a config row would be stale within days.
 *   2. rwa.xyz publishes a documented, key-authenticated API. Reading the
 *      app's internal payload instead is going around the front door. Their
 *      robots.txt does permit this path — checked, it disallows only /admin/
 *      and /api/ — but robots is not a licence.
 *   3. They are an aggregator. An index built from this is a copy of theirs.
 *
 * So it is gated behind ENABLE_DEV_SOURCES and exists to put real rows on the
 * sourcing screens while they are being built. The production answer is an
 * adapter against their API with a key, or crawling the venues themselves.
 */

const PAGE = "https://app.rwa.xyz/asset-screener";

export const DEV_SOURCE_KIND = "rwa";

export function devSourcesEnabled() {
	return process.env.ENABLE_DEV_SOURCES === "1";
}

type Named = { name?: unknown } | null | undefined;

function named(value: Named): string | null {
	if (!value || typeof value !== "object") return null;
	const name = (value as { name?: unknown }).name;
	return typeof name === "string" && name.trim() ? name.trim() : null;
}

function text(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function amount(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type Asset = {
	id?: unknown;
	name?: unknown;
	symbol?: unknown;
	website?: unknown;
	manager?: Named;
	platform?: Named;
	assetClass?: Named;
	jurisdiction?: Named;
	minInvestment?: { amount?: unknown; currency?: unknown } | null;
	stats?: Record<string, unknown> | null;
};

/**
 * The deploy hash, read from the page that uses it.
 *
 * Fetched fresh on every run. If they change how the page embeds it this
 * throws, the source turns red on the Sources screen, and nothing silently
 * carries on against a stale index — which is the failure mode that matters.
 */
async function buildId(): Promise<string> {
	const html = await fetchDocument(PAGE);
	const match = html.match(/"buildId":"([^"]{4,64})"/);

	if (!match) {
		throw new Error(
			"could not find buildId on the asset screener page — the dev adapter needs updating",
		);
	}

	return match[1];
}

export async function fetchRwa(): Promise<NormalisedOffering[]> {
	if (!devSourcesEnabled()) {
		throw new Error(
			"the rwa.xyz reader is development-only; set ENABLE_DEV_SOURCES=1 to use it",
		);
	}

	const id = await buildId();
	const body = await fetchDocument(
		`https://app.rwa.xyz/_next/data/${id}/asset-screener.json`,
	);

	let payload: { pageProps?: { assets?: unknown } };

	try {
		payload = JSON.parse(body) as typeof payload;
	} catch {
		throw new Error("asset screener payload was not valid JSON");
	}

	const assets = payload.pageProps?.assets;

	if (!Array.isArray(assets)) {
		throw new Error("no assets array in the payload — their shape has changed");
	}

	return assets.flatMap((entry): NormalisedOffering[] => {
		const asset = entry as Asset;

		const title = text(asset.name);
		const externalId =
			asset.id === undefined || asset.id === null ? null : String(asset.id);

		if (!title || !externalId) return [];

		return [
			{
				externalId,
				title,
				url: text(asset.website),
				issuer: named(asset.manager) ?? named(asset.platform),
				assetClass: named(asset.assetClass),
				jurisdiction: named(asset.jurisdiction),
				currency: text(asset.minInvestment?.currency),
				minimum: amount(asset.minInvestment?.amount),

				/*
				 * Left null on purpose, all three.
				 *
				 * These are open-ended funds and tokenized treasuries: they have a
				 * redemption frequency, not a maturity, and no seniority or coverage
				 * ratio to report. Writing a term or a DSCR here would be inventing
				 * one.
				 *
				 * stats.return is the tempting one and the worst of them — a bare
				 * number with no stated basis. Annualised, trailing thirty days,
				 * since inception? Mapping it to net yield would put a figure in
				 * front of an investor that nobody can defend. It stays in `raw`,
				 * where it is evidence rather than a claim, and every yield test
				 * against these rows reports "not published" instead.
				 */
				netYield: null,
				termMonths: null,
				seniority: null,
				dscr: null,

				raw: entry,
			},
		];
	});
}
