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
	name: "App",
	shortName: "App",
	description:
		"A Next.js application with a marketing site and a product dashboard.",
	url,
	/** BCP 47 tag for <html lang>. */
	lang: "en",
	/** Underscored form Open Graph expects. */
	locale: "en_US",
	creator: "App",
	publisher: "App",
	category: "technology",
	keywords: ["Next.js", "React", "TypeScript", "Dashboard"],
	/** Handle without the URL, e.g. "@app". Leave empty to omit the tag. */
	twitterHandle: "",
	colors: {
		light: "#ffffff",
		dark: "#0a0a0a",
	},
} as const;

/** Resolve a path against the site origin, e.g. absoluteUrl("/dashboard"). */
export function absoluteUrl(path: string) {
	return new URL(path, siteConfig.url).toString();
}
