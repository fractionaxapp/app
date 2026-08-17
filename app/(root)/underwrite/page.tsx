import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StagePage } from "../_components/stage-page";
import { stageBySlug } from "../_components/stages";
import { UnderwritingExtract } from "../_components/underwriting-extract";
import { UnderwritingTable } from "../_components/underwriting-table";

const stage = stageBySlug("underwrite");

export const metadata: Metadata = {
	title: "Underwrite",
	description:
		"Offering memos, term sheets and payment histories parsed into one comparable field set — so a $25,000 allocation is underwritten the way a $25M one is.",
	alternates: { canonical: "/underwrite" },
};

export default function UnderwritePage() {
	if (!stage) notFound();

	return (
		<StagePage stage={stage}>
			<UnderwritingExtract />
			<UnderwritingTable />
		</StagePage>
	);
}
