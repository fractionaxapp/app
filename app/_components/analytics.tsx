import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/*
 * Loads the Google tag (gtag.js) after hydration for every route. Renders
 * nothing when NEXT_PUBLIC_GA_ID is unset, which keeps local and preview
 * environments out of the property unless they opt in.
 *
 * Pageviews on client-side navigations are reported automatically, provided
 * "Enhanced Measurement → Page changes based on browser history events" is
 * enabled on the GA4 property.
 */
export function Analytics() {
	if (!GA_MEASUREMENT_ID) return null;

	return (
		<GoogleAnalytics
			gaId={GA_MEASUREMENT_ID}
			debugMode={process.env.NODE_ENV !== "production"}
		/>
	);
}
