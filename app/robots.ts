import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/*
 * Served at /robots.txt. The product surface under (app) is kept out of the
 * index — it needs auth and has nothing crawlable — which pairs with the
 * noindex metadata exported from app/(app)/layout.tsx.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/dashboard", "/api/"],
		},
		sitemap: absoluteUrl("/sitemap.xml"),
		host: absoluteUrl("/"),
	};
}
