import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscoveryCoverage } from "../_components/discovery-coverage";
import { DiscoveryFunnel } from "../_components/discovery-funnel";
import { DiscoveryGaps } from "../_components/discovery-gaps";
import { DiscoverySchema } from "../_components/discovery-schema";
import { StagePage } from "../_components/stage-page";
import { stageBySlug } from "../_components/stages";

const stage = stageBySlug("discover");

export const metadata: Metadata = {
	title: "Discover",
	description:
		"167 issuance platforms crawled continuously and normalised into a single index, so tokenized offerings that were never meant to be compared can be.",
	alternates: { canonical: "/discover" },
};

export default function DiscoverPage() {
	if (!stage) notFound();

	return (
		<StagePage stage={stage}>
			<DiscoveryCoverage />
			<DiscoveryFunnel />
			<DiscoverySchema />
			<DiscoveryGaps />
		</StagePage>
	);
}
