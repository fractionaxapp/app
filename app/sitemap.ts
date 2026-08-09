import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/*
 * Served at /sitemap.xml. Only public marketing routes belong here — the
 * dashboard is disallowed in robots.ts. Add entries as (root) routes land, or
 * map over a CMS response for content-driven pages.
 */
const routes = [{ path: "/", changeFrequency: "monthly", priority: 1 }] as const;

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return routes.map((route) => ({
		url: absoluteUrl(route.path),
		lastModified,
		changeFrequency: route.changeFrequency,
		priority: route.priority,
	}));
}
