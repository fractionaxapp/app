import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "App",
		template: "%s · App",
	},
	description: "A Next.js application.",
};

/*
 * Shared root layout. It owns <html>/<body>, the font variables and the token
 * stylesheet only — all visual chrome lives in the route group layouts under
 * (root) and (app).
 */
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${fontVariables} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
