"use server";

import { refresh } from "next/cache";

import { getAdmin } from "@/lib/admin";
import {
	createSource,
	deleteSource,
	findSource,
	setSourceEnabled,
} from "@/lib/db/sourcing";
import { crawlAll, crawlSource } from "@/lib/sourcing/crawl";

/*
 * Adding a venue means telling this server to go and fetch someone else's, on
 * a schedule. That is not a setting an ordinary account should hold, so every
 * action here re-derives administrator status from the session.
 */

async function requireAdmin() {
	const admin = await getAdmin();
	if (!admin) throw new Error("Not authorised to manage sources.");
	return admin;
}

export type SourceState = { error?: string; ok?: string };

export async function addSource(
	_previous: SourceState,
	formData: FormData,
): Promise<SourceState> {
	await requireAdmin();

	const label = String(formData.get("label") ?? "").trim();
	const url = String(formData.get("url") ?? "").trim();
	const kind = String(formData.get("kind") ?? "json");
	const mappingText = String(formData.get("mapping") ?? "").trim();

	if (!label) return { error: "Give the venue a name." };
	if (kind !== "json" && kind !== "rss") return { error: "Unknown source kind." };

	let parsed: URL;

	try {
		parsed = new URL(url);
	} catch {
		return { error: "That is not a URL." };
	}

	/*
	 * Refuse anything that is not public HTTP. Without this the crawler is a
	 * request forger: an administrator could point it at an internal address
	 * and read whatever this server can reach.
	 */
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		return { error: "Only http and https URLs can be crawled." };
	}

	if (
		/^(localhost|\[?::1\]?|0\.0\.0\.0)$/i.test(parsed.hostname) ||
		/^(10|127)\./.test(parsed.hostname) ||
		/^192\.168\./.test(parsed.hostname) ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)
	) {
		return { error: "That address is on a private network." };
	}

	let mapping: Record<string, unknown> = {};

	if (mappingText) {
		try {
			const value: unknown = JSON.parse(mappingText);

			if (!value || typeof value !== "object" || Array.isArray(value)) {
				return { error: "The mapping must be a JSON object." };
			}

			mapping = value as Record<string, unknown>;
		} catch {
			return { error: "The mapping is not valid JSON." };
		}
	}

	const slug =
		label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 60) || parsed.hostname;

	await createSource({ slug, label, kind, url, mapping });

	refresh();
	return { ok: `${label} added. Run it to see what comes back.` };
}

export async function toggleSource(formData: FormData) {
	await requireAdmin();

	const id = String(formData.get("id") ?? "");
	const enabled = String(formData.get("enabled") ?? "") === "true";

	if (!id) throw new Error("Invalid source reference.");

	await setSourceEnabled(id, enabled);
	refresh();
}

export async function removeSource(formData: FormData) {
	await requireAdmin();

	const id = String(formData.get("id") ?? "");
	if (!id) throw new Error("Invalid source reference.");

	// Offerings cascade with the source: an index entry whose provenance has
	// been deleted is not evidence of anything.
	await deleteSource(id);
	refresh();
}

export async function runCrawl(formData: FormData) {
	await requireAdmin();

	const id = String(formData.get("id") ?? "");

	if (id) {
		const source = await findSource(id);
		if (source) await crawlSource(source);
	} else {
		await crawlAll();
	}

	refresh();
}
