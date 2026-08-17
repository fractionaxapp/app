import Link from "next/link";

import { Arrow } from "./ui";

/*
 * The ledger shows a position drifting and stops there, which makes monitoring
 * look like a dashboard. This is what the drift is for.
 *
 * The last outcome loops back to Discover, and that is the point of the
 * section: the four stages are numbered like a line and the product is a
 * cycle. A breach re-opens the question the mandate was written to answer.
 */

const steps = [
	{
		label: "You are told",
		detail:
			"On the day the test fails or the payment is missed — not at the next statement, and not by you noticing.",
		at: "Immediately",
	},
	{
		label: "The position is re-underwritten",
		detail:
			"Against current reported data rather than the offering memo, using the same fields the original underwriting used.",
		at: "Same day",
	},
	{
		label: "It is priced against what is available now",
		detail:
			"The index is queried again with your mandate, so the question becomes what you would buy today rather than what you bought then.",
		at: "Same day",
	},
];

const outcomes = [
	{
		label: "Hold",
		body: "The breach is technical or temporary and the position still fits the mandate.",
		href: null,
	},
	{
		label: "Exit, if there is an exit",
		body: "A secondary bid may exist. It may not, and no amount of monitoring creates one.",
		href: null,
	},
	{
		label: "Rewrite the mandate",
		body: "If the answer has changed, the agent starts again from discovery with the new one.",
		href: "/discover",
	},
];

export function MonitorEscalation() {
	return (
		<section className="fx-section fx-bleed">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">When it breaches</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Watching a number fall is only worth anything if something happens
						when it lands.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border bg-surface">
						<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
							<p className="fx-eyebrow text-muted">
								Trigger · covenant breached or payment missed
							</p>
							<p className="fx-eyebrow text-accent">3 steps, then your call</p>
						</div>

						<ol className="px-5 py-2">
							{steps.map((step, index) => (
								<li key={step.label} className="flex gap-4 py-4">
									<div className="relative flex w-1.5 shrink-0 justify-center">
										<span
											aria-hidden
											className="absolute inset-y-[-1rem] w-px bg-border"
										/>
										<span
											aria-hidden
											className="relative mt-1.5 size-1.5 shrink-0 bg-primary"
										/>
									</div>

									<div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
										<div className="max-w-2xl">
											<p className="flex flex-wrap items-baseline gap-x-3">
												<span className="fx-eyebrow text-muted tabular-nums">
													{String(index + 1).padStart(2, "0")}
												</span>
												<span className="text-sm font-semibold">
													{step.label}
												</span>
											</p>
											<p className="mt-1.5 text-sm text-pretty text-muted">
												{step.detail}
											</p>
										</div>

										<p className="fx-eyebrow text-muted">{step.at}</p>
									</div>
								</li>
							))}
						</ol>

						{/* The fork. Three outcomes, and the last one is the loop. */}
						<div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
							{outcomes.map((outcome) => {
								const body = (
									<>
										<p className="fx-eyebrow text-accent">{outcome.label}</p>
										<p className="mt-3 text-sm text-pretty text-muted">
											{outcome.body}
										</p>
										{outcome.href ? (
											<p className="fx-eyebrow mt-4 flex items-center gap-2 text-primary">
												Back to discovery
												<Arrow className="size-3" />
											</p>
										) : null}
									</>
								);

								return outcome.href ? (
									<Link
										key={outcome.label}
										href={outcome.href}
										className="bg-surface px-5 py-5 transition-colors hover:bg-surface-muted"
									>
										{body}
									</Link>
								) : (
									<div key={outcome.label} className="bg-surface px-5 py-5">
										{body}
									</div>
								);
							})}
						</div>
					</div>

					<p className="mt-5 text-sm text-pretty text-muted">
						The decision is yours in every case. The agent re-runs the work so
						that it is an informed one, and it does not exit a position on your
						behalf unless the mandate says it may.
					</p>
				</div>
			</div>
		</section>
	);
}
