import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import { listLiveOfferings, listMandates } from "@/lib/db/sourcing";
import { decisionCounts, listUnderwritable } from "@/lib/db/underwriting";
import { findUserByPrivyDid } from "@/lib/db/users";
import { assess } from "@/lib/sourcing/assess";
import { runMandate } from "@/lib/sourcing/match";

import { Artwork } from "../../_components/artwork";
import { Panel } from "../../_components/panel";

import { decide } from "./actions";

export const metadata: Metadata = { title: "Underwrite" };

const PER_PAGE = 10;

/*
 * Offerings loaded to match against, as on the sourcing screen. The index has
 * to be in memory for the length of a request because a verdict is computed
 * per row, and the screen says so when it does not all fit.
 */
const CONSIDERED = 5000;

const states = [
	{ key: "open", label: "To do" },
	{ key: "accepted", label: "Accepted" },
	{ key: "watching", label: "Watching" },
	{ key: "rejected", label: "Rejected" },
	{ key: "all", label: "Everything" },
] as const;

const verdictTone: Record<string, string> = {
	accepted: "text-primary",
	watching: "text-accent",
	rejected: "text-muted",
};

const meta = "font-mono text-xs tracking-wide text-muted";

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

/** Accept, watch or reject — the same controls whether or not one was used. */
function Decide({
	offeringId,
	note,
	decided = false,
}: {
	offeringId: string;
	note: string | null;
	decided?: boolean;
}) {
	return (
		<form action={decide} className="flex flex-col gap-3">
			<input type="hidden" name="offeringId" value={offeringId} />

			<textarea
				name="note"
				rows={2}
				maxLength={2000}
				defaultValue={note ?? ""}
				placeholder="Why — the part worth keeping"
				className="w-full resize-y border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted/50 focus-visible:border-primary focus-visible:outline-none"
			/>

			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					name="verdict"
					value="accepted"
					className="fx-eyebrow min-h-9 cursor-pointer border border-primary/50 px-3 font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-background"
				>
					Accept
				</button>
				<button
					type="submit"
					name="verdict"
					value="watching"
					className="fx-eyebrow min-h-9 cursor-pointer border border-border px-3 text-muted transition-colors hover:border-accent hover:text-accent"
				>
					Watch
				</button>
				<button
					type="submit"
					name="verdict"
					value="rejected"
					className="fx-eyebrow min-h-9 cursor-pointer border border-border px-3 text-muted transition-colors hover:border-danger hover:text-danger"
				>
					Reject
				</button>
				{decided ? (
					<button
						type="submit"
						name="verdict"
						value="clear"
						className="fx-eyebrow min-h-9 cursor-pointer px-2 text-muted/70 transition-colors hover:text-foreground"
					>
						Undecide
					</button>
				) : null}
			</div>
		</form>
	);
}

/*
 * Underwriting, as far as this data honestly goes.
 *
 * There are no offering documents here — no memo, no payment history, no
 * covenant tests — so nothing on this screen forms a credit view, and the
 * agent does not pretend to. What it does is the part that can be done from
 * what venues publish: say how much of a credit view the published fields
 * would support, name what is missing, flag what cannot be checked, and record
 * what the person reading it decided.
 *
 * That is a real job. An allocator's first question about a new name is
 * whether there is enough on the table to form a view at all, and most of
 * these offerings answer no — which is worth knowing before a call rather
 * than during one.
 */
export default async function UnderwritePage({
	searchParams,
}: {
	searchParams: Promise<{
		state?: string;
		q?: string;
		page?: string;
		mandate?: string;
	}>;
}) {
	const access = await getAccess();

	if (access.state === "signed-out") return null;
	if (access.state === "waiting") redirect("/dashboard");

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Underwrite">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is nothing to underwrite.
					</p>
				</Panel>
			</div>
		);
	}

	const user = await findUserByPrivyDid(access.did);
	if (!user) redirect("/dashboard");

	const params = await searchParams;

	const state =
		states.find((entry) => entry.key === params.state)?.key ?? "open";
	const search = (params.q ?? "").slice(0, 100);
	const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

	const mandates = await listMandates(user.id);

	const selected =
		mandates.find((mandate) => mandate.id === params.mandate) ?? null;

	/*
	 * Underwriting works on what was sourced for you.
	 *
	 * The matcher runs here rather than in SQL for the same reason it does on
	 * the sourcing screen: one set of rules produces both the verdict and its
	 * reason, and splitting that across two languages is how the two drift.
	 *
	 * Deals that cannot be verified are queued alongside the ones that matched.
	 * They are not failures — the venue simply did not publish a field the
	 * mandate asks about — and they are exactly the ones a person needs to look
	 * at, which is what this screen is for.
	 */
	const offerings =
		mandates.length > 0 ? await listLiveOfferings(CONSIDERED) : [];

	const sourcedBy = new Map<string, string[]>();

	for (const mandate of selected ? [selected] : mandates) {
		const { matched, unverifiable } = runMandate(offerings, mandate.criteria);

		for (const { offering } of [...matched, ...unverifiable]) {
			const seen = sourcedBy.get(offering.id) ?? [];
			seen.push(mandate.statement);
			sourcedBy.set(offering.id, seen);
		}
	}

	const sourcedIds = [...sourcedBy.keys()];

	const [counts, queue] = await Promise.all([
		decisionCounts(user.id),
		listUnderwritable({
			userId: user.id,
			ids: sourcedIds,
			state: state === "all" ? null : state,
			search,
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
		}),
	]);

	const pages = Math.max(1, Math.ceil(queue.total / PER_PAGE));

	const href = (changes: Record<string, string>) => {
		const next = new URLSearchParams();
		const merged = {
			state,
			q: search,
			page: String(page),
			mandate: selected?.id ?? "",
			...changes,
		};

		if (merged.mandate) next.set("mandate", merged.mandate);
		if (merged.state !== "open") next.set("state", merged.state);
		if (merged.q) next.set("q", merged.q);
		if (merged.page !== "1") next.set("page", merged.page);

		const query = next.toString();
		return `/dashboard/underwrite${query ? `?${query}` : ""}`;
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-4">
				{[
					{ label: "Sourced", value: sourcedIds.length, tone: "text-muted" },
					{ label: "Accepted", value: counts.accepted, tone: "text-primary" },
					{ label: "Watching", value: counts.watching, tone: "text-accent" },
					{ label: "Rejected", value: counts.rejected, tone: "text-muted" },
				].map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p
							className={`mt-3 font-mono text-3xl leading-none font-medium tracking-tight tabular-nums ${metric.tone}`}
						>
							{metric.value.toLocaleString("en-GB")}
						</p>
					</article>
				))}
			</section>

			<p className="px-1 text-sm text-pretty text-muted">
				These are the deals your mandates sourced — the ones that matched, and
				the ones nobody can verify against what the venue published. There are
				no offering documents in the index, so nothing here forms a credit view:
				it reports how much of one the published fields would support, and what
				is missing. The decision is yours, recorded with your reasoning.
			</p>

			{mandates.length === 0 ? (
				<Panel title="Nothing sourced yet">
					<p className="px-5 py-6 text-pretty text-muted">
						Underwriting works on what your mandates sourced, and you have not
						written one.{" "}
						<Link
							href="/dashboard/sourcing"
							className="text-primary underline underline-offset-4"
						>
							Describe what you are looking for
						</Link>{" "}
						and the deals that fit it arrive here.
					</p>
				</Panel>
			) : (
				<Panel
					title="Sourced by"
					status={
						<span className="text-muted">
							{selected ? "One mandate" : `${mandates.length} mandates`}
						</span>
					}
				>
					<nav className="flex flex-wrap gap-2 px-5 py-3.5">
						<Link
							href={href({ mandate: "", page: "1" })}
							aria-current={selected ? undefined : "page"}
							className={`fx-eyebrow border px-2.5 py-1.5 transition-colors ${
								selected
									? "border-border text-muted hover:text-foreground"
									: "border-primary text-primary"
							}`}
						>
							Every mandate
						</Link>

						{mandates.map((mandate) => (
							<Link
								key={mandate.id}
								href={href({ mandate: mandate.id, page: "1" })}
								aria-current={selected?.id === mandate.id ? "page" : undefined}
								title={mandate.statement}
								className={`max-w-md truncate border px-2.5 py-1.5 font-mono text-xs transition-colors ${
									selected?.id === mandate.id
										? "border-primary text-primary"
										: "border-border text-muted hover:text-foreground"
								}`}
							>
								{mandate.statement}
							</Link>
						))}
					</nav>
				</Panel>
			)}

			<Panel
				title="Underwriting queue"
				status={
					<span className="text-muted">
						{queue.total.toLocaleString("en-GB")} shown
					</span>
				}
			>
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-3.5">
					<nav className="inline-flex flex-wrap gap-px bg-border">
						{states.map((entry) => (
							<Link
								key={entry.key}
								href={href({ state: entry.key, page: "1" })}
								aria-current={entry.key === state ? "page" : undefined}
								className={`fx-eyebrow px-3.5 py-2 transition-colors ${
									entry.key === state
										? "bg-surface-muted text-foreground"
										: "bg-surface text-muted hover:text-foreground"
								}`}
							>
								{entry.label}
							</Link>
						))}
					</nav>

					<form className="flex items-center gap-px bg-border">
						<input type="hidden" name="state" value={state} />
						<input
							type="search"
							name="q"
							defaultValue={search}
							placeholder="Name or issuer"
							aria-label="Search the queue"
							className="min-h-9 w-56 bg-surface px-3 font-mono text-xs outline-none placeholder:text-muted/50 focus:bg-surface-muted"
						/>
						<button
							type="submit"
							className="fx-eyebrow min-h-9 cursor-pointer bg-surface px-3.5 text-muted transition-colors hover:text-foreground"
						>
							Find
						</button>
					</form>
				</div>

				{queue.rows.length === 0 ? (
					<p className="px-5 py-8 text-pretty text-muted">
						{state === "open"
							? sourcedIds.length === 0
								? "Your mandates matched nothing in the index, so there is nothing to underwrite. Widen a mandate, or add a venue under Administration → Sources."
								: "Nothing left to look at. Every sourced deal has a decision against it."
							: "Nothing here yet."}
					</p>
				) : (
					<ul>
						{queue.rows.map((offering) => {
							const report = assess(offering);
							const blocking = report.flags.filter(
								(flag) => flag.severity === "blocking",
							);

							return (
								<li
									key={offering.id}
									className="border-b border-border px-5 py-5 last:border-b-0"
								>
									<div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
										<div className="min-w-0">
											<p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
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

											{/* Which mandate put this in front of you. */}
											{!selected && sourcedBy.get(offering.id)?.length ? (
												<p className={`mt-1.5 ${meta}`}>
													Sourced by{" "}
													<span className="text-muted/80">
														{sourcedBy.get(offering.id)?.join(" · ")}
													</span>
												</p>
											) : null}

											<p className={`mt-1.5 flex flex-wrap gap-1.5 ${meta}`}>
												{[
													offering.issuer,
													offering.jurisdiction,
													offering.asset_class,
												]
													.filter(Boolean)
													.map((fact) => (
														<span
															key={fact as string}
															className="border border-border px-1.5 py-0.5 text-muted/80"
														>
															{fact}
														</span>
													))}
											</p>
										</div>

										<div className="text-right">
											{/*
											 * The headline is coverage, not a score. A score would
											 * imply a view of the deal; this is a count of what the
											 * venue was willing to say.
											 */}
											<p className="fx-eyebrow text-muted">Published</p>
											<p
												className={`mt-1 font-mono text-xl tabular-nums ${
													report.underwritable ? "text-primary" : "text-accent"
												}`}
											>
												{report.published}
												<span className="text-sm text-muted">
													/{report.total}
												</span>
											</p>
										</div>
									</div>

									{/* The bar is the same count, in a form you can compare down a column. */}
									<div className="mt-4 flex h-1 w-full bg-border">
										<span
											className={
												report.underwritable ? "bg-primary" : "bg-accent"
											}
											style={{
												width: `${(report.published / report.total) * 100}%`,
											}}
										/>
									</div>

									<div className="mt-4 grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
										<div className="min-w-0">
											{report.flags.length > 0 ? (
												<ul className="flex flex-col gap-2">
													{report.flags.map((flag) => (
														<li key={flag.label} className="flex gap-3">
															<span
																aria-hidden
																className={`mt-1.5 size-1.5 shrink-0 ${
																	flag.severity === "blocking"
																		? "bg-danger"
																		: "bg-accent"
																}`}
															/>
															<span className="min-w-0 text-sm">
																<span
																	className={
																		flag.severity === "blocking"
																			? "text-danger"
																			: "text-accent"
																	}
																>
																	{flag.label}
																</span>{" "}
																<span className="text-muted">
																	{flag.detail}
																</span>
															</span>
														</li>
													))}
												</ul>
											) : (
												<p className="text-sm text-muted">
													Nothing missing that would stop a view being formed.
												</p>
											)}

											{report.missing.length > 0 ? (
												<p className={`mt-3 ${meta}`}>
													Not published: {report.missing.join(", ")}
												</p>
											) : null}
										</div>

										<div className="min-w-0">
											{/*
											 * A decision that has been taken reads as one. Leaving
											 * Accept, Watch and Reject sitting there afterwards makes a
											 * settled row look like an open question, and the note —
											 * the part worth keeping — was hidden inside a box you had
											 * to notice was already filled in.
											 *
											 * Changing your mind stays possible, one fold away.
											 */}
											{offering.verdict ? (
												<div className="flex flex-col gap-3">
													<p className="flex flex-wrap items-baseline gap-x-3">
														<span
															className={`fx-eyebrow ${verdictTone[offering.verdict]}`}
														>
															{offering.verdict}
														</span>
														{offering.decided_at ? (
															<span className={meta}>
																{stamp.format(offering.decided_at)}
															</span>
														) : null}
													</p>

													{offering.note ? (
														<p className="border-l-2 border-border pl-3 text-sm text-pretty text-muted">
															{offering.note}
														</p>
													) : (
														<p className={meta}>No reasoning recorded.</p>
													)}

													<details className="group">
														<summary className="fx-eyebrow flex cursor-pointer list-none items-center gap-2 text-muted/70 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
															<span
																aria-hidden
																className="inline-block transition-transform group-open:rotate-90"
															>
																›
															</span>
															Change this
														</summary>

														<div className="mt-3">
															<Decide
																offeringId={offering.id}
																note={offering.note}
																decided
															/>
														</div>
													</details>
												</div>
											) : (
												<Decide offeringId={offering.id} note={offering.note} />
											)}
										</div>
									</div>

									{blocking.length > 0 ? (
										<p className={`mt-4 ${meta}`}>
											A view cannot be formed from what is published here.
											Accepting is still yours to do — the reasoning goes in the
											note.
										</p>
									) : null}
								</li>
							);
						})}
					</ul>
				)}

				{queue.total > PER_PAGE ? (
					<div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-3.5">
						<p className={meta}>
							{((page - 1) * PER_PAGE + 1).toLocaleString("en-GB")}–
							{Math.min(page * PER_PAGE, queue.total).toLocaleString("en-GB")}{" "}
							of {queue.total.toLocaleString("en-GB")}
						</p>

						<div className="flex items-center gap-px bg-border">
							{page > 1 ? (
								<Link
									href={href({ page: String(page - 1) })}
									className="fx-eyebrow bg-surface px-3.5 py-2 text-muted transition-colors hover:text-foreground"
								>
									Previous
								</Link>
							) : (
								<span className="fx-eyebrow bg-surface px-3.5 py-2 text-muted/40">
									Previous
								</span>
							)}

							<span className="fx-eyebrow bg-surface px-3.5 py-2 text-muted">
								Page {page} of {pages}
							</span>

							{page < pages ? (
								<Link
									href={href({ page: String(page + 1) })}
									className="fx-eyebrow bg-surface px-3.5 py-2 text-muted transition-colors hover:text-foreground"
								>
									Next
								</Link>
							) : (
								<span className="fx-eyebrow bg-surface px-3.5 py-2 text-muted/40">
									Next
								</span>
							)}
						</div>
					</div>
				) : null}
			</Panel>

			<p className="px-1 text-sm text-pretty text-muted">
				Minimums, terms and coverage come from{" "}
				<Link
					href="/dashboard/discover"
					className="text-primary underline underline-offset-4"
				>
					the index
				</Link>
				. What the venue actually published for any of these is on its record,
				including the fields nothing here reads.
			</p>
		</div>
	);
}
