import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import {
	committed,
	findPolicy,
	listAcceptedForExecution,
	listAllocations,
} from "@/lib/db/execution";
import { findUserByPrivyDid } from "@/lib/db/users";

import { Artwork } from "../../_components/artwork";
import { SessionExpired } from "../../_components/session-expired";
import { Panel } from "../../_components/panel";

import { markAllocation } from "./actions";
import { PlanForm, PolicyForm } from "./forms";
import { ReceivingWallet } from "./receiving-wallet";

export const metadata: Metadata = { title: "Execute" };

const meta = "font-mono text-xs tracking-wide text-muted";

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const statusTone: Record<string, string> = {
	planned: "text-accent",
	executed: "text-primary",
	cancelled: "text-muted/60",
};

function money(value: string | null, currency?: string | null) {
	if (value === null) return null;

	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) return null;

	return `${parsed.toLocaleString("en-GB")}${currency ? ` ${currency}` : ""}`;
}

/*
 * Execute, as far as this product honestly goes.
 *
 * There is no custody here and no venue API behind it, so nothing on this
 * screen sends money anywhere and it says so plainly. What it does is the part
 * that is real: hold the limits an account has set, refuse an allocation that
 * would breach one before it is recorded rather than after it is regretted,
 * and keep the record of what was actually done at the venue.
 *
 * That is the honest half of "you approve, the agent settles" — the approving.
 * Settling is a claim this product has not earned yet, and a button that
 * pretended to would be the worst thing on the site.
 */
export default async function ExecutePage() {
	const access = await getAccess();

	// The browser thinks it is signed in and this server disagrees; say so
	// rather than rendering an empty page inside working chrome.
	if (access.state === "signed-out") return <SessionExpired />;
	if (access.state === "waiting") redirect("/dashboard");

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Execute">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is nothing to allocate against.
					</p>
				</Panel>
			</div>
		);
	}

	const user = await findUserByPrivyDid(access.did);
	if (!user) redirect("/dashboard");

	const [policy, accepted, allocations, totals] = await Promise.all([
		findPolicy(user.id),
		listAcceptedForExecution(user.id),
		listAllocations(user.id),
		committed(user.id),
	]);

	const currency = policy?.currency ?? "USD";
	const maxTotal = policy?.max_total
		? Number.parseFloat(policy.max_total)
		: null;

	const remaining = maxTotal
		? maxTotal - totals.planned - totals.executed
		: null;

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-4">
				{[
					{
						label: "Ready to allocate",
						value: accepted.length.toLocaleString("en-GB"),
						tone: "text-muted",
					},
					{
						label: "Planned",
						value: totals.planned.toLocaleString("en-GB"),
						tone: "text-accent",
					},
					{
						label: "Executed",
						value: totals.executed.toLocaleString("en-GB"),
						tone: "text-primary",
					},
					{
						label: "Left under the cap",
						value:
							remaining === null ? "No cap" : remaining.toLocaleString("en-GB"),
						tone:
							remaining !== null && remaining < 0
								? "text-danger"
								: "text-muted",
					},
				].map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p
							className={`mt-3 font-mono text-2xl leading-none font-medium tracking-tight tabular-nums ${metric.tone}`}
						>
							{metric.value}
						</p>
					</article>
				))}
			</section>

			<p className="px-1 text-sm text-pretty text-muted">
				Nothing here moves money. There is no custody in this product and no
				connection to any venue, so an allocation is a decision, checked against
				your limits and recorded — you settle it at the venue yourself and note
				what happened. When settlement is real, it will run through these same
				limits.
			</p>

			<Panel
				title="Your limits"
				status={
					<span className="text-muted">
						{policy?.updated_at
							? `Set ${stamp.format(policy.updated_at)}`
							: "Not set"}
					</span>
				}
			>
				<PolicyForm
					maxPerAllocation={policy?.max_per_allocation ?? null}
					maxTotal={policy?.max_total ?? null}
					currency={currency}
				/>

				<p className="border-t border-border px-5 py-4 text-sm text-pretty text-muted">
					Checked on the server before an allocation is recorded, against the
					offering as stored and these limits as stored — never against anything
					the page sent. A limit the page could edit would not be one.
				</p>
			</Panel>

			{/*
			 * Only once there is something to allocate against. An account that
			 * signs up, reads, and decides nothing never sees this panel — and so
			 * never has a wallet made for it.
			 */}
			{accepted.length > 0 || allocations.length > 0 ? (
				<ReceivingWallet />
			) : null}

			<Panel
				title="Accepted at underwriting"
				status={
					<span className="text-muted">
						{accepted.length} awaiting an allocation
					</span>
				}
			>
				{accepted.length === 0 ? (
					<p className="px-5 py-6 text-pretty text-muted">
						Nothing accepted yet, or everything accepted already has an
						allocation against it.{" "}
						<Link
							href="/dashboard/underwrite"
							className="text-primary underline underline-offset-4"
						>
							Underwriting
						</Link>{" "}
						is where a deal earns its place here.
					</p>
				) : (
					<ul>
						{accepted.map((offering) => (
							<li
								key={offering.id}
								className="border-b border-border px-5 py-5 last:border-b-0"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
									<p className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
										{offering.icon_url ? (
											<Artwork src={offering.icon_url} alt="" size={16} />
										) : null}
										<Link
											href={`/dashboard/offerings/${offering.id}`}
											className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline"
										>
											{offering.title}
										</Link>
										{offering.symbol ? (
											<span className={meta}>{offering.symbol}</span>
										) : null}
									</p>

									<p className={meta}>
										{offering.minimum
											? `minimum ${money(offering.minimum, offering.currency)}`
											: "no minimum published"}
									</p>
								</div>

								{offering.note ? (
									<p className="mt-2 border-l-2 border-border pl-3 text-sm text-pretty text-muted">
										{offering.note}
									</p>
								) : null}

								<PlanForm
									offeringId={offering.id}
									minimum={offering.minimum}
									currency={offering.currency}
								/>
							</li>
						))}
					</ul>
				)}
			</Panel>

			<Panel
				title="Allocations"
				status={
					<span className="text-muted">
						{allocations.length === 0 ? "None yet" : `${allocations.length}`}
					</span>
				}
			>
				{allocations.length === 0 ? (
					<p className="px-5 py-6 text-pretty text-muted">
						Nothing planned. An allocation recorded here is a decision and a
						record — it is not an instruction to anyone.
					</p>
				) : (
					<ul>
						{allocations.map((allocation) => (
							<li
								key={allocation.id}
								className="border-b border-border px-5 py-4 last:border-b-0"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
									<p className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
										{allocation.icon_url ? (
											<Artwork src={allocation.icon_url} alt="" size={16} />
										) : null}
										<Link
											href={`/dashboard/offerings/${allocation.offering_id}`}
											className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline"
										>
											{allocation.title}
										</Link>
										<span
											className={`fx-eyebrow ${statusTone[allocation.status]}`}
										>
											{allocation.status}
										</span>
										{allocation.withdrawn_at ? (
											<span className="fx-eyebrow text-danger">
												withdrawn at the venue
											</span>
										) : null}
									</p>

									<p className="font-mono text-sm tabular-nums">
										{money(allocation.amount, allocation.currency)}
									</p>
								</div>

								<p className={`mt-1.5 flex flex-wrap gap-x-4 gap-y-1 ${meta}`}>
									<span>planned {stamp.format(allocation.created_at)}</span>
									{allocation.executed_at ? (
										<span>executed {stamp.format(allocation.executed_at)}</span>
									) : null}
									{allocation.reference ? (
										<span>ref {allocation.reference}</span>
									) : null}
									{allocation.url ? (
										<a
											href={allocation.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline underline-offset-4"
										>
											Open at the venue
										</a>
									) : null}
								</p>

								{allocation.note ? (
									<p className="mt-2 text-sm text-pretty text-muted">
										{allocation.note}
									</p>
								) : null}

								{allocation.status === "planned" ? (
									<div className="mt-3 flex flex-wrap items-end gap-2">
										{/*
										 * Marking it executed is a claim about the world, so it
										 * asks for the venue's own reference alongside.
										 */}
										<form
											action={markAllocation}
											className="flex flex-wrap items-end gap-2"
										>
											<input type="hidden" name="id" value={allocation.id} />
											<input type="hidden" name="status" value="executed" />
											<label>
												<span className="fx-eyebrow text-muted/70">
													Venue reference
												</span>
												<input
													name="reference"
													maxLength={200}
													placeholder="order id, tx hash, note"
													className="mt-1 min-h-9 w-64 border border-border bg-background px-2 font-mono text-xs text-foreground placeholder:text-muted/50 focus-visible:border-primary focus-visible:outline-none"
												/>
											</label>
											<button
												type="submit"
												className="fx-eyebrow min-h-9 cursor-pointer border border-primary/50 px-3 font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-background"
											>
												Mark executed
											</button>
										</form>

										<form action={markAllocation}>
											<input type="hidden" name="id" value={allocation.id} />
											<input type="hidden" name="status" value="cancelled" />
											<button
												type="submit"
												className="fx-eyebrow min-h-9 cursor-pointer border border-border px-3 text-muted transition-colors hover:border-danger hover:text-danger"
											>
												Cancel
											</button>
										</form>
									</div>
								) : null}
							</li>
						))}
					</ul>
				)}
			</Panel>
		</div>
	);
}
