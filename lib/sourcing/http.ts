import "server-only";

import { siteConfig } from "@/lib/site";

/*
 * The outbound half of the crawler.
 *
 * Two rules are enforced here rather than left to each adapter, because an
 * adapter that forgets one of them is a crawler that misbehaves on someone
 * else's server:
 *
 *   1. robots.txt is fetched and obeyed before any offering URL is read.
 *   2. Every request is bounded — by time, by size, and by redirect count.
 *
 * We identify ourselves properly. A crawler that hides what it is gives the
 * other side no way to ask it to stop, and the whole arrangement depends on
 * them being able to.
 */

export const USER_AGENT = `FractionaxBot/1.0 (+${siteConfig.url.origin})`;

/** Our token in robots.txt, lowercased for matching. */
const AGENT_TOKEN = "fractionaxbot";

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 5_000_000;

type RobotsRule = { allow: boolean; path: string };

/*
 * Cached per origin for the life of the process. A crawl run is minutes long
 * at most, so this never serves a stale answer for long, and it stops one run
 * asking the same host for robots.txt once per offering.
 */
const robotsCache = new Map<string, RobotsRule[] | null>();

/**
 * Parse the groups that apply to us: our own token if present, otherwise `*`.
 * A specific group wins outright — that is what the standard says, and a
 * crawler that merges the two would ignore a rule aimed at it.
 */
function parseRobots(body: string): RobotsRule[] {
	const groups = new Map<string, RobotsRule[]>();
	let current: string[] = [];

	for (const rawLine of body.split(/\r?\n/)) {
		const line = rawLine.split("#")[0].trim();
		if (!line) continue;

		const [field, ...rest] = line.split(":");
		const key = field.trim().toLowerCase();
		const value = rest.join(":").trim();

		if (key === "user-agent") {
			current = [value.toLowerCase()];
			for (const agent of current) {
				if (!groups.has(agent)) groups.set(agent, []);
			}
			continue;
		}

		if (key !== "allow" && key !== "disallow") continue;

		for (const agent of current) {
			groups.get(agent)?.push({ allow: key === "allow", path: value });
		}
	}

	return groups.get(AGENT_TOKEN) ?? groups.get("*") ?? [];
}

/** Longest matching rule wins; Allow beats Disallow at equal length. */
function rulesAllow(rules: RobotsRule[], path: string) {
	let winner: RobotsRule | null = null;

	for (const rule of rules) {
		// An empty Disallow means "nothing is disallowed" and matches nothing.
		if (!rule.path) continue;
		if (!path.startsWith(rule.path)) continue;

		if (
			!winner ||
			rule.path.length > winner.path.length ||
			(rule.path.length === winner.path.length && rule.allow)
		) {
			winner = rule;
		}
	}

	return winner ? winner.allow : true;
}

/**
 * Whether robots.txt permits us to read this URL.
 *
 * A robots.txt that cannot be fetched is treated as permission — that is the
 * convention, and treating a 500 on their end as a ban would mean one bad
 * deploy stops us reading a venue for as long as it lasts. A robots.txt that
 * *is* fetched and disallows us is obeyed without argument.
 */
export async function isAllowed(target: string): Promise<boolean> {
	let url: URL;

	try {
		url = new URL(target);
	} catch {
		return false;
	}

	if (url.protocol !== "https:" && url.protocol !== "http:") return false;

	if (!robotsCache.has(url.origin)) {
		try {
			const response = await fetch(new URL("/robots.txt", url.origin), {
				headers: { "user-agent": USER_AGENT },
				signal: AbortSignal.timeout(TIMEOUT_MS),
				redirect: "follow",
			});

			robotsCache.set(
				url.origin,
				response.ok ? parseRobots(await response.text()) : null,
			);
		} catch {
			robotsCache.set(url.origin, null);
		}
	}

	const rules = robotsCache.get(url.origin);
	if (!rules) return true;

	return rulesAllow(rules, url.pathname + url.search);
}

export class FetchError extends Error {}

/**
 * Fetch a document, bounded and identified. Throws FetchError with a message
 * fit to store against the source and show an administrator.
 */
export async function fetchDocument(target: string): Promise<string> {
	if (!(await isAllowed(target))) {
		throw new FetchError("robots.txt disallows this URL");
	}

	let response: Response;

	try {
		response = await fetch(target, {
			headers: {
				"user-agent": USER_AGENT,
				accept: "application/json, application/xml, text/xml;q=0.9, */*;q=0.5",
			},
			signal: AbortSignal.timeout(TIMEOUT_MS),
			redirect: "follow",
		});
	} catch (error) {
		throw new FetchError(
			error instanceof Error ? error.message : "request failed",
		);
	}

	if (!response.ok) {
		throw new FetchError(`HTTP ${response.status}`);
	}

	const declared = Number(response.headers.get("content-length") ?? 0);
	if (declared > MAX_BYTES) {
		throw new FetchError(`response too large (${declared} bytes)`);
	}

	const body = await response.text();

	// Not every server sends content-length, so the real check is here.
	if (body.length > MAX_BYTES) {
		throw new FetchError(`response too large (${body.length} bytes)`);
	}

	return body;
}
