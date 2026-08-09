/*
 * Analytics configuration. Isomorphic — safe to import from both server and
 * client components, so it holds no browser-only imports.
 */

/**
 * GA4 measurement ID, e.g. `G-XXXXXXXXXX`. Leave `NEXT_PUBLIC_GA_ID` unset to
 * disable analytics entirely: nothing is loaded and every event no-ops.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export const isAnalyticsEnabled = Boolean(GA_MEASUREMENT_ID);

export type AnalyticsEventParams = Record<string, string | number | boolean>;
