import "server-only";

import { fetchDocument } from "./http";

/*
 * Reading the JSON a Next.js site loads for one of its own pages.
 *
 * Those payloads live at /_next/data/<buildId>/<route>.json, and the build id
 * changes every time the site deploys. Storing it would mean a source that
 * works until their next release and then 404s until someone notices, so it is
 * discovered from the page itself on every run: fetch the page, read the id
 * out of it, then fetch the data.
 *
 * That costs one extra request per crawl and buys a source that survives
 * deploys without anyone touching a config row. Nothing here is specific to a
 * particular site — the page URL is configuration, so pointing this at another
 * Next.js site is a row rather than a deploy.
 *
 * If the id cannot be found this throws. The source turns red on the Sources
 * screen and stops, which is the right failure: the alternative is quietly
 * serving whatever the index happened to hold before the site changed shape.
 */

export type NextDataTarget = {
	/** A page on the site, e.g. https://app.rwa.xyz/asset-screener */
	page: string;
	/**
	 * A build id to use instead of reading one off the page.
	 *
	 * Discovery is the right default and stays the default. This is for when it
	 * stops working — the site changes how it embeds the id, or serves a page
	 * whose id does not match its data — and someone needs the crawl running
	 * again today rather than after a deploy. A pinned id will eventually go
	 * stale, and the source turns red when it does, which is the intended
	 * outcome: an override that fails loudly beats one that quietly serves
	 * nothing.
	 */
	buildId?: string | null;
};

/**
 * Pull the build id out of a rendered Next.js page.
 *
 * Two ways, because the markup has changed shape across Next versions and will
 * again: the __NEXT_DATA__ script if it is there, and a direct search if it is
 * not. Newer apps inline it in the flight payload rather than that script tag.
 */
export function buildIdFrom(html: string): string | null {
	const script = html.match(
		/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
	);

	if (script) {
		try {
			const parsed = JSON.parse(script[1]) as { buildId?: unknown };
			if (typeof parsed.buildId === "string" && parsed.buildId) {
				return parsed.buildId;
			}
		} catch {
			// Fall through to the direct search below.
		}
	}

	const direct = html.match(/"buildId":\s*"([^"]{1,128})"/);
	return direct ? direct[1] : null;
}

/**
 * The data URL for a page, resolved against the build id it advertises.
 *
 * The route is the page's own path: /asset-screener becomes
 * /_next/data/<id>/asset-screener.json, and the site root becomes index.json.
 */
export function dataUrlFor(page: string, buildId: string) {
	const url = new URL(page);
	const route = url.pathname.replace(/^\/+|\/+$/g, "") || "index";

	return new URL(
		`/_next/data/${buildId}/${route}.json${url.search}`,
		url.origin,
	).toString();
}

/** Fetch a page's data payload, discovering the build id on the way. */
export async function fetchNextData(target: NextDataTarget): Promise<unknown> {
	const pinned = target.buildId?.trim();

	// A pinned id skips the page fetch entirely: one request instead of two.
	const buildId = pinned || buildIdFrom(await fetchDocument(target.page));

	if (!buildId) {
		throw new Error(
			`could not find a Next.js build id on ${target.page} — the site may no longer expose one`,
		);
	}

	const body = await fetchDocument(dataUrlFor(target.page, buildId));

	try {
		return JSON.parse(body);
	} catch {
		throw new Error("the page data endpoint did not return JSON");
	}
}
