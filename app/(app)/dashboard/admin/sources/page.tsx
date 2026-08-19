import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdmin } from "@/lib/admin";
import { isAiConfigured, aiModel } from "@/lib/ai";
import { isDatabaseEnabled } from "@/lib/db/client";
import { listSources, offeringStats } from "@/lib/db/sourcing";
import { USER_AGENT } from "@/lib/sourcing/http";
import { devSourcesEnabled } from "@/lib/sourcing/rwa";

import { Panel } from "../../../_components/panel";

import { removeSource, runCrawl, toggleSource } from "./actions";
import { SourceForm } from "./source-form";

/* Gated in metadata as well as in the body — see the access queue for why. */
export async function generateMetadata(): Promise<Metadata> {
	if (!(await getAdmin())) notFound();

	return { title: "Sources", robots: { index: false, follow: false } };
}

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

const meta = "font-mono text-xs tracking-wide text-muted";

const button =
	"fx-eyebrow inline-flex min-h-9 cursor-pointer items-center border px-3.5 font-semibold transition-colors";

/*
 * The venues the crawler reads.
 *
 * Adding one here points this server at someone else's on a schedule, which is
 * why the screen shows what we send as well as what we got back: robots.txt is
 * obeyed, the user agent identifies us, and both of those are only worth
 * anything if an operator can see them.
 */
export default async function SourcesPage() {
	const admin = await getAdmin();
	if (!admin) notFound();

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Sources">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is nowhere to record a venue.
					</p>
				</Panel>
			</div>
		);
	}

	const [sources, stats] = await Promise.all([listSources(), offeringStats()]);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-3">
				{[
					{ label: "Offerings indexed", value: stats.live },
					{ label: "Venues configured", value: sources.length },
					{ label: "Withdrawn", value: stats.withdrawn },
				].map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p className="mt-3 font-mono text-3xl leading-none font-medium tracking-tight text-accent tabular-nums">
							{metric.value}
						</p>
					</article>
				))}
			</section>

			<Panel
				title="Venues"
				status={
					sources.length > 0 ? (
						<form action={runCrawl}>
							<button
								type="submit"
								className={`${button} border-primary/50 text-primary hover:border-primary hover:bg-primary hover:text-background`}
							>
								Run all now
							</button>
						</form>
					) : null
				}
			>
				{sources.length === 0 ? (
					<p className="px-5 py-6 text-pretty text-muted">
						No venue is configured, so the crawler has nothing to read and the
						index stays empty. Add one below.
					</p>
				) : (
					<ul>
						{sources.map((source) => (
							<li
								key={source.id}
								className="border-b border-border px-5 py-4 last:border-b-0"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
									<div className="min-w-0">
										<p className="flex flex-wrap items-baseline gap-x-3 text-sm font-semibold">
											{source.label}
											<span className="fx-eyebrow text-muted">
												{source.kind}
											</span>
											{!source.enabled ? (
												<span className="fx-eyebrow text-muted">Paused</span>
											) : null}
										</p>

										<p className={`mt-1.5 break-all ${meta}`}>{source.url}</p>

										<p className={`mt-1.5 ${meta}`}>
											{source.last_run_at ? (
												<>
													Last run {stamp.format(source.last_run_at)} ·{" "}
													{source.last_status === "ok" ? (
														<span className="text-primary">
															{source.last_count} offering
															{source.last_count === 1 ? "" : "s"}
														</span>
													) : (
														<span className="text-danger">
															{source.last_error ?? "failed"}
														</span>
													)}
												</>
											) : (
												"Never run"
											)}
										</p>
									</div>

									<div className="flex flex-wrap gap-2">
										<form action={runCrawl}>
											<input type="hidden" name="id" value={source.id} />
											<button
												type="submit"
												className={`${button} border-primary/50 text-primary hover:border-primary hover:bg-primary hover:text-background`}
											>
												Run
											</button>
										</form>

										<form action={toggleSource}>
											<input type="hidden" name="id" value={source.id} />
											<input
												type="hidden"
												name="enabled"
												value={String(!source.enabled)}
											/>
											<button
												type="submit"
												className={`${button} border-border text-muted hover:border-foreground hover:text-foreground`}
											>
												{source.enabled ? "Pause" : "Resume"}
											</button>
										</form>

										<form action={removeSource}>
											<input type="hidden" name="id" value={source.id} />
											<button
												type="submit"
												className={`${button} border-border text-muted hover:border-danger hover:text-danger`}
											>
												Remove
											</button>
										</form>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</Panel>

			<Panel title="Add a venue">
				<SourceForm devEnabled={devSourcesEnabled()} />
			</Panel>

			<Panel title="How the crawler behaves">
				<dl className="px-5 py-5 text-sm">
					<div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border pb-3">
						<dt className="fx-eyebrow w-40 text-muted">Identifies as</dt>
						<dd className="font-mono text-xs break-all">{USER_AGENT}</dd>
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border py-3">
						<dt className="fx-eyebrow w-40 text-muted">robots.txt</dt>
						<dd className="text-pretty text-muted">
							Fetched per origin and obeyed. A disallowed URL is not read, and
							the source records that as its error.
						</dd>
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border py-3">
						<dt className="fx-eyebrow w-40 text-muted">Limits</dt>
						<dd className="text-pretty text-muted">
							15 second timeout, 5 MB ceiling, venues crawled one at a time.
						</dd>
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border py-3">
						<dt className="fx-eyebrow w-40 text-muted">Development sources</dt>
						<dd className="text-pretty text-muted">
							{devSourcesEnabled()
								? "ENABLE_DEV_SOURCES is on. The rwa.xyz reader is available: it reads that site's own page payload rather than a published API, from an aggregator rather than a venue, and it fills in no yield, term, seniority or coverage — those show as unverifiable. It is for building these screens against real rows, not for production."
								: "Off. Set ENABLE_DEV_SOURCES=1 to enable the rwa.xyz reader while building these screens."}
						</dd>
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-1 pt-3">
						<dt className="fx-eyebrow w-40 text-muted">Reading prose</dt>
						<dd className="text-pretty text-muted">
							{isAiConfigured()
								? `${aiModel()} fills in fields a feed only states in words, for up to 25 offerings per run. It is told to omit anything the offering does not state.`
								: "Not configured. Fields a venue only states in prose stay null and show as unverifiable. Set ANTHROPIC_API_KEY to have the model read them."}
						</dd>
					</div>
				</dl>
			</Panel>
		</div>
	);
}
