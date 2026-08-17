import type { Metadata } from "next";

import { getAccess } from "@/lib/access";

import { Waitlist } from "../_components/waitlist";

export const metadata: Metadata = {
	title: "Dashboard",
};

const metrics = [
	{ label: "Committed", value: "—", hint: "No positions yet" },
	{ label: "Distributions", value: "—", hint: "Nothing settled yet" },
	{ label: "Open mandates", value: "—", hint: "None running" },
];

/*
 * The server-side boundary. Identity comes from the verified session cookie and
 * approval from our own database — never from the client. Reading either opts
 * this route into dynamic rendering, which is correct for anything specific to
 * one account.
 *
 * Signing in is not the same as being admitted: during the private beta an
 * account exists as soon as someone authenticates, but the product is only
 * shown once that account has been approved by hand.
 */
export default async function DashboardPage() {
	const access = await getAccess();

	// AuthGate renders the sign-in screen in this case; this is belt and braces
	// for a session that expires between the gate and this render.
	if (access.state === "signed-out") return null;

	if (access.state === "waiting") return <Waitlist access={access} />;

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
				<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">
						{access.email ? `Signed in as ${access.email}` : "Overview"}
					</p>

					<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
						<span aria-hidden className="size-1.5 bg-primary" />
						Access granted
					</p>
				</div>

				<p className="max-w-prose px-5 py-6 text-pretty text-muted">
					Your account is admitted to the private beta. Composing and running
					mandates is not wired up yet — when it is, it lands here.
				</p>
			</section>
		</div>
	);
}
