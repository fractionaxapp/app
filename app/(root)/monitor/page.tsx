import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MonitorDrift } from "../_components/monitor-drift";
import { MonitorLedger } from "../_components/monitor-ledger";
import { StagePage } from "../_components/stage-page";
import { stageBySlug } from "../_components/stages";

const stage = stageBySlug("monitor");

export const metadata: Metadata = {
	title: "Monitor",
	description:
		"Distributions, covenants and secondary marks tracked continuously by the same model that underwrote the position.",
	alternates: { canonical: "/monitor" },
};

export default function MonitorPage() {
	if (!stage) notFound();

	return (
		<StagePage stage={stage}>
			<MonitorLedger />
			<MonitorDrift />
		</StagePage>
	);
}
