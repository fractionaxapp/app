"use client";

import Link from "next/link";

import type { ComponentProps } from "react";
import type { AnalyticsEventParams } from "@/lib/analytics";

import { trackEvent } from "@/lib/track-event";

type TrackedLinkProps = ComponentProps<typeof Link> & {
	/** GA4 event name, e.g. `cta_click`. */
	event: string;
	eventParams?: AnalyticsEventParams;
};

/**
 * A `<Link>` that reports a GA4 event on click. Keeps the client boundary at
 * the link itself, so the surrounding layout stays a server component.
 */
export function TrackedLink({
	event,
	eventParams,
	onClick,
	...props
}: TrackedLinkProps) {
	return (
		<Link
			{...props}
			onClick={(clickEvent) => {
				trackEvent(event, eventParams);
				onClick?.(clickEvent);
			}}
		/>
	);
}
