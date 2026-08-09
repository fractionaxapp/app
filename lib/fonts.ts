import { Geist, Geist_Mono } from "next/font/google";

/*
 * Typography feature. The CSS variables are named after their role rather than
 * the typeface, so swapping the project's fonts is a one-file change here —
 * globals.css and every consumer keep working untouched.
 */

const sans = Geist({
	variable: "--font-app-sans",
	subsets: ["latin"],
});

const mono = Geist_Mono({
	variable: "--font-app-mono",
	subsets: ["latin"],
});

export const fonts = { sans, mono } as const;

/**
 * Class names declaring the font CSS variables. Apply to <html> in the root
 * layout so the variables resolve for the whole document.
 */
export const fontVariables = `${sans.variable} ${mono.variable}`;
