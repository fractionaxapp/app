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
			<section className="grid gap-4 sm:grid-cols-3">
				{metrics.map((metric) => (
					<article
						key={metric.label}
						className="rounded-lg border border-border bg-surface p-5"
					>
						<p className="text-muted">{metric.label}</p>
						<p className="mt-2 text-2xl font-semibold tracking-tight">
							{metric.value}
						</p>
						<p className="mt-1 text-xs text-muted">{metric.hint}</p>
					</article>
				))}
			</section>

			<section className="rounded-lg border border-border bg-surface p-6">
				<h2 className="font-medium">
					{user?.email?.address
						? `Signed in as ${user.email.address}`
						: "Overview"}
				</h2>
				<p className="mt-2 max-w-prose text-muted">
					This route lives in the (app) group. Add sibling routes beside it and
					they inherit the sidebar and topbar automatically, without touching
					the marketing layout.
				</p>
			</section>
		</div>
	);
}
