import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/* Served at /manifest.webmanifest; Next links it from <head> automatically. */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: siteConfig.name,
		short_name: siteConfig.shortName,
		description: siteConfig.description,
		id: "/",
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: siteConfig.colors.light,
		theme_color: siteConfig.colors.light,
		categories: [siteConfig.category],
		icons: [
			{
				src: "/icon",
				sizes: "32x32",
				type: "image/png",
			},
			{
				src: "/apple-icon",
				sizes: "180x180",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
