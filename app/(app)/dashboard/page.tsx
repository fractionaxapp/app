import type { Metadata } from "next";

import { getSessionUser } from "@/lib/wallet/server";

export const metadata: Metadata = {
	title: "Dashboard",
};

const metrics = [
	{ label: "Active users", value: "—", hint: "No data source connected" },
	{ label: "Revenue", value: "—", hint: "No data source connected" },
	{ label: "Conversion", value: "—", hint: "No data source connected" },
];

/*
 * The server-side boundary: identity comes from the verified session cookie,
 * never from the client. Reading it opts this route into dynamic rendering,
 * which is correct for anything user-specific.
 */
export default async function DashboardPage() {
	const user = await getSessionUser();

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-3">
				{metrics.map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p className="mt-3 font-mono text-3xl leading-none font-medium tracking-tight text-accent tabular-nums">
							{metric.value}
						</p>
						<p className="mt-3 text-xs text-muted">{metric.hint}</p>
					</article>
				))}
			</section>

			<section className="border border-border bg-surface">
				<div className="border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">
						{user?.email?.address
							? `Signed in as ${user.email.address}`
							: "Overview"}
					</p>
				</div>

				<p className="max-w-prose px-5 py-6 text-pretty text-muted">
					This route lives in the (app) group. Add sibling routes beside it and
					they inherit the sidebar and topbar automatically, without touching
					the marketing layout.
				</p>
			</section>
		</div>
	);
}
