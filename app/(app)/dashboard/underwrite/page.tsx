import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { isDatabaseEnabled } from "@/lib/db/client";
import { offeringStats } from "@/lib/db/sourcing";
import { decisionCounts, listUnderwritable } from "@/lib/db/underwriting";
import { findUserByPrivyDid } from "@/lib/db/users";
import { assess } from "@/lib/sourcing/assess";

import { Artwork } from "../../_components/artwork";
import { Panel } from "../../_components/panel";

import { decide } from "./actions";

export const metadata: Metadata = { title: "Underwrite" };

const PER_PAGE = 10;

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
	searchParams: Promise<{ state?: string; q?: string; page?: string }>;
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

	const [stats, counts, queue] = await Promise.all([
		offeringStats(),
		decisionCounts(user.id),
		listUnderwritable({
			userId: user.id,
			state: state === "all" ? null : state,
			search,
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
		}),
	]);

	const pages = Math.max(1, Math.ceil(queue.total / PER_PAGE));

	const href = (changes: Record<string, string>) => {
		const next = new URLSearchParams();
		const merged = { state, q: search, page: String(page), ...changes };

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
					{ label: "Indexed", value: stats.live, tone: "text-muted" },
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
				There are no offering documents in the index — only the fields venues
				publish about themselves — so nothing here forms a credit view. What it
				reports is how much of one the published fields would support, and what
				is missing. The decision is yours, and it is recorded with your
				reasoning.
			</p>

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
							? "Nothing left to look at. Every indexed offering has a decision against it."
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
											{offering.verdict ? (
												<p className="mb-3 text-sm">
													<span
														className={`fx-eyebrow ${verdictTone[offering.verdict]}`}
													>
														{offering.verdict}
													</span>
													{offering.decided_at ? (
														<span className={`ml-3 ${meta}`}>
															{stamp.format(offering.decided_at)}
														</span>
													) : null}
												</p>
											) : null}

											<form action={decide} className="flex flex-col gap-3">
												<input
													type="hidden"
													name="offeringId"
													value={offering.id}
												/>

												<textarea
													name="note"
													rows={2}
													maxLength={2000}
													defaultValue={offering.note ?? ""}
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
													{offering.verdict ? (
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
