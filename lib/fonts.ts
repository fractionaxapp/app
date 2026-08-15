import { Archivo, IBM_Plex_Mono } from "next/font/google";

/*
 * Typography feature. The CSS variables are named after their role rather than
 * the typeface, so swapping the project's fonts is a one-file change here —
 * globals.css and every consumer keep working untouched.
 *
 * Archivo is a grotesque that holds up at weight 800 with heavy negative
 * tracking, which is what the display type on the marketing surface asks for.
 * Plex Mono carries every label, eyebrow and figure.
 */

const sans = Archivo({
	variable: "--font-app-sans",
	subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
	variable: "--font-app-mono",
	subsets: ["latin"],
	// Plex Mono is not a variable font, so the weights used must be listed.
	weight: ["400", "500", "600"],
});

export const fonts = { sans, mono } as const;

/**
 * Class names declaring the font CSS variables. Apply to <html> in the root
 * layout so the variables resolve for the whole document.
 */
export const fontVariables = `${sans.variable} ${mono.variable}`;
