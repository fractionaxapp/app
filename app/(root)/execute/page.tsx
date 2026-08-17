import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExecutionChecks } from "../_components/execution-checks";
import { ExecutionPolicy } from "../_components/execution-policy";
import { StagePage } from "../_components/stage-page";
import { stageBySlug } from "../_components/stages";

const stage = stageBySlug("execute");

export const metadata: Metadata = {
	title: "Execute",
	description:
		"Settlement on-chain inside limits you set — size, venue and counterparty. Approval on every trade by default, delegated only if you choose to.",
	alternates: { canonical: "/execute" },
};

export default function ExecutePage() {
	if (!stage) notFound();

	return (
		<StagePage stage={stage}>
			<ExecutionPolicy />
			<ExecutionChecks />
		</StagePage>
	);
}
