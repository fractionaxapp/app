/*
 * Single source of truth for everything that describes the site: metadata,
 * the web manifest, robots, sitemap and the generated OG/icon images all read
 * from here, so renaming or rebranding is a one-file change.
 */

/**
 * Absolute origin the site is served from. Required for canonical URLs, OG
 * images and the sitemap, all of which must be fully qualified. Falls back to
 * localhost so `next build` works without configuration.
 */
const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const siteConfig = {
	name: "Fractionax",
	shortName: "Fractionax",
	description:
		"AI agents that find, underwrite, and execute private-market investments on-chain. The decision layer for tokenized real-world assets.",
	url,
	/** BCP 47 tag for <html lang>. */
	lang: "en",
	/** Underscored form Open Graph expects. */
	locale: "en_US",
	creator: "Fractionax",
	publisher: "Fractionax",
	category: "finance",
	keywords: [
		"real-world assets",
		"RWA",
		"tokenization",
		"private markets",
		"AI agents",
		"onchain settlement",
		"private credit",
	],
	/** Handle without the URL, e.g. "@app". Leave empty to omit the tag. */
	twitterHandle: "",
	colors: {
		// The marketing surface is committed dark in both schemes, so the
		// browser chrome should be too — see .ds-web in app/globals.css.
		light: "#050505",
		dark: "#050505",
	},
} as const;

/** Resolve a path against the site origin, e.g. absoluteUrl("/dashboard"). */
export function absoluteUrl(path: string) {
	return new URL(path, siteConfig.url).toString();
}
