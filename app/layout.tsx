import type { Metadata, Viewport } from "next";

import { fontVariables } from "@/lib/fonts";
import { siteConfig } from "@/lib/site";
import { Analytics } from "./_components/analytics";

import "./globals.css";

export const metadata: Metadata = {
	// Lets every other metadata field below use relative paths.
	metadataBase: siteConfig.url,

	title: {
		default: siteConfig.name,
		template: `%s · ${siteConfig.name}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	keywords: [...siteConfig.keywords],
	category: siteConfig.category,
	authors: [{ name: siteConfig.creator, url: siteConfig.url.toString() }],
	creator: siteConfig.creator,
	publisher: siteConfig.publisher,

	// Send the full URL to same-origin destinations, origin only cross-origin.
	referrer: "origin-when-cross-origin",

	// Stop iOS Safari turning numbers and addresses into links inside the UI.
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},

	alternates: {
		canonical: "/",
	},

	openGraph: {
		type: "website",
		siteName: siteConfig.name,
		title: siteConfig.name,
		description: siteConfig.description,
		url: "/",
		locale: siteConfig.locale,
		// Images come from app/opengraph-image.tsx automatically.
	},

	twitter: {
		card: "summary_large_image",
		title: siteConfig.name,
		description: siteConfig.description,
		...(siteConfig.twitterHandle
			? { creator: siteConfig.twitterHandle, site: siteConfig.twitterHandle }
			: {}),
	},

	// Indexing is the default, so no blanket "index, follow" is emitted here —
	// that would fight the noindex Next adds to boundaries like not-found.
	// Only the Google-specific preview allowances need stating.
	robots: {
		googleBot: {
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},

	appleWebApp: {
		capable: true,
		title: siteConfig.name,
		statusBarStyle: "default",
	},

	// Only emitted when the environment supplies a token.
	verification: {
		...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
			? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
			: {}),
	},

	// Icons and the manifest are wired up by their file conventions:
	// icon.tsx, apple-icon.tsx and manifest.ts.
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	// One committed scheme, so form controls and scrollbars follow it.
	colorScheme: "dark",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: siteConfig.colors.light },
		{ media: "(prefers-color-scheme: dark)", color: siteConfig.colors.dark },
	],
};

/*
 * Shared root layout. It owns <html>/<body> and mounts the app-wide features —
 * typography and analytics — while all visual chrome lives in the route group
 * layouts under (root) and (app).
 */
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang={siteConfig.lang}
			className={`${fontVariables} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				{children}
				<Analytics />
			</body>
		</html>
	);
}
