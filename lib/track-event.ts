"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { isAnalyticsEnabled, type AnalyticsEventParams } from "./analytics";

/**
 * Send a custom GA4 event. No-ops when no measurement ID is configured, so
 * call sites never need to guard on analytics being switched on.
 */
export function trackEvent(name: string, params: AnalyticsEventParams = {}) {
	if (!isAnalyticsEnabled) return;

	sendGAEvent("event", name, params);
}
