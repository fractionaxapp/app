import type { Metadata } from "next";
import Link from "next/link";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import { committed, findPolicy, listAllocations } from "@/lib/db/execution";
import {
	listLiveOfferings,
	listMandates,
	offeringStats,
} from "@/lib/db/sourcing";
import { decisionCounts } from "@/lib/db/underwriting";
import { findUserByPrivyDid } from "@/lib/db/users";
import { runMandate } from "@/lib/sourcing/match";

import { SessionExpired } from "../_components/session-expired";
import { Panel } from "../_components/panel";
import { Waitlist } from "../_components/waitlist";

export const metadata: Metadata = {
	title: "Dashboard",
};

const meta = "font-mono text-xs tracking-wide text-muted";

/* As on the sourcing screen: the index has to be in memory to match against. */
const CONSIDERED = 5000;

/*
 * The server-side boundary. Identity comes from the verified session cookie and
 * approval from our own database — never from the client. Reading either opts
 * this route into dynamic rendering, which is correct for anything specific to
 * one account.
 *
 * Signing in is not the same as being admitted: during the private beta an
 * account exists as soon as someone authenticates, but the product is only
 * shown once that account has been approved by hand.
 *
 * What it shows is the state of the four stages and the one thing to do next.
 * It used to say composing mandates was not wired up yet, which stopped being
 * true some time ago — a first screen that is out of date is worse than a
 * plain one, because it is the only page a returning account is guaranteed to
 * read.
 */
export default async function DashboardPage() {
	const access = await getAccess();

	// AuthGate renders the sign-in screen in this case; this is belt and braces
	// for a session that expires between the gate and this render.
	// The browser thinks it is signed in and this server disagrees; say so
	// rather than rendering an empty page inside working chrome.
	if (access.state === "signed-out") return <SessionExpired />;

	if (access.state === "waiting") return <Waitlist access={access} />;

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Overview">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is nothing to report yet.
					</p>
				</Panel>
			</div>
		);
	}

	const user = await findUserByPrivyDid(access.did);

	const [stats, mandates, decisions, allocations, totals, policy] =
		await Promise.all([
			offeringStats(),
			user ? listMandates(user.id) : [],
			user
				? decisionCounts(user.id)
				: { accepted: 0, watching: 0, rejected: 0 },
			user ? listAllocations(user.id) : [],
			user ? committed(user.id) : { planned: 0, executed: 0 },
			user ? findPolicy(user.id) : null,
		]);

	/*
	 * How many deals the account's mandates put in front of it — matches and
	 * the ones nobody can verify, which is what the underwriting queue holds.
	 */
	const offerings =
		mandates.length > 0 && stats.live > 0
			? await listLiveOfferings(CONSIDERED)
			: [];

	const sourced = new Set<string>();

	for (const mandate of mandates) {
		const { matched, unverifiable } = runMandate(offerings, mandate.criteria);
		for (const { offering } of [...matched, ...unverifiable])
			sourced.add(offering.id);
	}

	const decided = decisions.accepted + decisions.watching + decisions.rejected;
	const toUnderwrite = Math.max(0, sourced.size - decided);
	const planned = allocations.filter((a) => a.status === "planned").length;
	const executedCount = allocations.filter(
		(a) => a.status === "executed",
	).length;

	/*
	 * One next step, chosen by where the chain actually stops. A dashboard that
	 * lists everything you could do is a dashboard nobody acts on.
	 */
	const next =
		stats.live === 0
			? {
					title: "Nothing is indexed yet",
					body: "No venue has been crawled, so there is nothing for a mandate to match. Venues are added under Administration → Sources.",
					href: "/dashboard/admin/sources",
					action: "Add a venue",
				}
			: mandates.length === 0
				? {
						title: "Write a mandate",
						body: "Describe what you are looking for in a sentence. Deals that fit it arrive in sourcing, and from there into underwriting.",
						href: "/dashboard/sourcing",
						action: "Compose one",
					}
				: sourced.size === 0
					? {
							title: "Your mandates match nothing indexed",
							body: "Every indexed offering fails a criterion. Widen a mandate, or add a venue that lists the kind of deal you are asking for.",
							href: "/dashboard/sourcing",
							action: "Review mandates",
						}
					: toUnderwrite > 0
						? {
								title: `${toUnderwrite.toLocaleString("en-GB")} sourced, not yet looked at`,
								body: "Underwriting reports how much of a credit view the published fields would support, and what is missing. The verdict is yours.",
								href: "/dashboard/underwrite",
								action: "Work the queue",
							}
						: decisions.accepted > allocations.length
							? {
									title: "Accepted deals with no allocation",
									body: "Set your limits, size the position, and record what you do at the venue.",
									href: "/dashboard/execute",
									action: "Allocate",
								}
							: planned > 0
								? {
										title: `${planned} allocation${planned === 1 ? "" : "s"} planned`,
										body: "Nothing is sent anywhere by this product. Settle at the venue, then record the reference against the allocation.",
										href: "/dashboard/execute",
										action: "Record it",
									}
								: {
										title: "Nothing waiting on you",
										body: "The queue is clear. New offerings arrive as venues are crawled, and anything matching a mandate lands in underwriting.",
										href: "/dashboard/discover",
										action: "Browse the index",
									};

	const stages = [
		{
			label: "Discover",
			href: "/dashboard/discover",
			value: stats.live.toLocaleString("en-GB"),
			hint:
				stats.venues === 1
					? "offerings from one venue"
					: `offerings from ${stats.venues} venues`,
		},
		{
			label: "Sourcing",
			href: "/dashboard/sourcing",
			value: sourced.size.toLocaleString("en-GB"),
			hint:
				mandates.length === 0
					? "no mandate written"
					: `matched by ${mandates.length} mandate${mandates.length === 1 ? "" : "s"}`,
		},
		{
			label: "Underwrite",
			href: "/dashboard/underwrite",
			value: toUnderwrite.toLocaleString("en-GB"),
			hint:
				decided === 0
					? "none decided"
					: `${decisions.accepted} accepted · ${decisions.watching} watching · ${decisions.rejected} rejected`,
		},
		{
			label: "Execute",
			href: "/dashboard/execute",
			/*
			 * A count, like the three before it. The strip reads as one chain, and
			 * an amount sitting where a count sits made a zero next to "10 planned"
			 * look like a contradiction rather than two different measures.
			 */
			value: executedCount.toLocaleString("en-GB"),
			hint: [
				`${planned} planned`,
				totals.executed > 0
					? `${totals.executed.toLocaleString("en-GB")} committed`
					: null,
				policy ? "limits set" : "no limits set",
			]
				.filter(Boolean)
				.join(" · "),
		},
	];

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			{/* The chain, in order, each stage carrying its own number. */}
			<section className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
				{stages.map((stage) => (
					<Link
						key={stage.label}
						href={stage.href}
						className="group bg-surface px-5 py-6 transition-colors hover:bg-surface-muted"
					>
						<p className="fx-eyebrow text-muted transition-colors group-hover:text-primary">
							{stage.label}
						</p>
						<p className="mt-3 font-mono text-3xl leading-none font-medium tracking-tight text-accent tabular-nums">
							{stage.value}
						</p>
						<p className="mt-3 text-xs text-pretty text-muted">{stage.hint}</p>
					</Link>
				))}
			</section>

			<Panel
				title="Next"
				status={
					<span className="flex items-center gap-2.5 text-primary">
						<span aria-hidden className="size-1.5 bg-primary" />
						Access granted
					</span>
				}
			>
				<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 px-5 py-6">
					<div className="min-w-0 max-w-prose">
						<h2 className="text-[clamp(18px,2vw,24px)] leading-tight font-extrabold tracking-[-0.02em] text-balance uppercase">
							{next.title}
						</h2>
						<p className="mt-3 text-pretty text-muted">{next.body}</p>
					</div>

					<Link
						href={next.href}
						className="fx-eyebrow inline-flex min-h-11 items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary"
					>
						{next.action}
					</Link>
				</div>

				<p className={`border-t border-border px-5 py-3.5 ${meta}`}>
					{access.email ? `Signed in as ${access.email}` : "Signed in"}
					{mandates[0] ? ` · latest mandate: ${mandates[0].statement}` : ""}
				</p>
			</Panel>

			<p className="px-1 text-sm text-pretty text-muted">
				Nothing in this product settles a trade or moves money. Deals are
				sourced from what venues publish, assessed against what they left out,
				and allocated only when you record that you did it —{" "}
				<Link
					href="/disclosures"
					className="text-primary underline underline-offset-4"
				>
					disclosures
				</Link>
				.
			</p>
		</div>
	);
}
