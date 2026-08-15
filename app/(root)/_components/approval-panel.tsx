"use client";

import { useEffect, useState } from "react";

/*
 * The hero visual, and the claim in the headline made literal: the agent has
 * already decided, and the decision is sitting there waiting for a human.
 *
 * Interactive on purpose. Approving and rejecting is the product's core
 * gesture, so letting a visitor perform it is worth more than describing it —
 * and the panel then carries the consequence through settlement, because a
 * demo that stops at the last click never shows what approving is *for*.
 *
 * The deals are illustrative and the panel says so.
 */

const ALLOCATION_PER_DEAL = 25_000;
const SETTLE_MS = 1800;

type Verdict = "approved" | "rejected";
type Stage = "reviewing" | "executing" | "settled";

type Deal = {
	id: string;
	origin: string;
	name: string;
	metrics: string[];
};

const deals: Deal[] = [
	{
		id: "sg-trade",
		origin: "SG · Trade finance",
		name: "Receivables pool VII",
		metrics: ["9.2% net", "1.8× DSCR", "24 mo"],
	},
	{
		id: "id-cre",
		origin: "ID · Commercial real estate",
		name: "Jakarta logistics II",
		metrics: ["8.6% net", "1.5× DSCR", "36 mo"],
	},
	{
		id: "vn-credit",
		origin: "VN · Private credit",
		name: "SME bridge facility",
		metrics: ["8.1% net", "1.6× DSCR", "18 mo"],
	},
];

/*
 * Seeded so all three review states — approved, rejected, still pending — are
 * on screen before anyone touches it. The pending card carries both buttons,
 * which is what makes the affordance obvious.
 */
const SEED: Record<string, Verdict> = {
	"sg-trade": "approved",
	"vn-credit": "rejected",
};

function Check({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 12 12" fill="none" aria-hidden className={className}>
			<path
				d="M2.5 6.5 5 9l4.5-5.5"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="square"
			/>
		</svg>
	);
}

function Cross({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 12 12" fill="none" aria-hidden className={className}>
			<path
				d="M3 3l6 6M9 3l-6 6"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="square"
			/>
		</svg>
	);
}

const DECIDED = {
	approved: {
		label: "Approved",
		Icon: Check,
		className: "border-primary bg-primary text-primary-foreground",
	},
	rejected: {
		label: "Rejected",
		Icon: Cross,
		className: "border-danger text-danger",
	},
} as const;

export function ApprovalPanel() {
	const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(SEED);
	// The only thing worth storing: whether the settle delay has elapsed.
	const [hasSettled, setHasSettled] = useState(false);

	const pending = deals.filter((deal) => !verdicts[deal.id]).length;
	const approved = deals.filter(
		(deal) => verdicts[deal.id] === "approved",
	).length;

	/*
	 * Stage is derived, not stored. Once every deal has a verdict the agent
	 * takes over again — settling what was approved, or reporting back with
	 * nothing to do.
	 */
	const stage: Stage =
		pending > 0
			? "reviewing"
			: approved === 0 || hasSettled
				? "settled"
				: "executing";

	useEffect(() => {
		if (stage !== "executing") return;

		// Zero delay rather than an early setState, so the state change always
		// happens in a callback instead of during the effect itself.
		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const timer = window.setTimeout(
			() => setHasSettled(true),
			reduced ? 0 : SETTLE_MS,
		);

		return () => window.clearTimeout(timer);
	}, [stage]);

	function decide(id: string, verdict: Verdict) {
		// Any change to a verdict restarts the run.
		setHasSettled(false);
		setVerdicts((current) => {
			const next = { ...current };
			// Clicking the standing verdict again returns the deal to pending.
			if (next[id] === verdict) delete next[id];
			else next[id] = verdict;
			return next;
		});
	}

	const status =
		stage === "executing"
			? "Executing · settling on-chain"
			: stage === "settled"
				? approved > 0
					? "Settled · monitoring live"
					: "Nothing approved"
				: `${pending} awaiting your decision`;

	return (
		<div className="border border-border bg-surface">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-2.5">
				<p className="fx-eyebrow text-muted">
					Example shortlist · 3 of 37 matches
				</p>

				<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
					<span className="relative flex size-1.5">
						<span className="absolute inline-flex size-full animate-ping bg-primary opacity-70" />
						<span className="relative inline-flex size-1.5 bg-primary" />
					</span>
					{status}
				</p>
			</div>

			{/* Min height holds the panel steady as it moves between stages, so
			    the fold below it does not jump. */}
			<div className="min-h-38">
				{stage === "reviewing" ? (
					<div className="flex snap-x snap-mandatory gap-px overflow-x-auto bg-border md:grid md:grid-cols-3 md:overflow-visible">
						{deals.map((deal) => {
							const verdict = verdicts[deal.id];
							const decided = verdict ? DECIDED[verdict] : null;
							const dimmed = verdict === "rejected" ? "opacity-45" : "";

							return (
								<div
									key={deal.id}
									className="flex min-w-[85%] shrink-0 snap-start flex-col gap-3.5 bg-surface px-5 py-4 md:min-w-0"
								>
									<div>
										<p className="fx-eyebrow text-muted">{deal.origin}</p>
										<p
											className={`mt-2 text-base leading-tight font-extrabold tracking-[-0.03em] uppercase transition-opacity ${dimmed}`}
										>
											{deal.name}
										</p>
									</div>

									<dl
										className={`flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm tracking-tight tabular-nums transition-opacity ${dimmed}`}
									>
										{deal.metrics.map((metric) => (
											<dd key={metric}>{metric}</dd>
										))}
									</dl>

									{decided ? (
										<button
											type="button"
											onClick={() => decide(deal.id, verdict)}
											title="Undo"
											className={`fx-eyebrow mt-auto flex h-10 cursor-pointer items-center justify-between gap-3 border px-3 font-semibold transition-colors ${decided.className}`}
										>
											{decided.label}
											<decided.Icon className="size-3" />
										</button>
									) : (
										<div className="mt-auto grid grid-cols-2 gap-2">
											<button
												type="button"
												onClick={() => decide(deal.id, "approved")}
												className="fx-eyebrow flex h-10 cursor-pointer items-center justify-between gap-2 border border-border px-3 font-semibold transition-colors hover:border-primary hover:text-primary"
											>
												Approve
												<Check className="size-3" />
											</button>

											<button
												type="button"
												onClick={() => decide(deal.id, "rejected")}
												className="fx-eyebrow flex h-10 cursor-pointer items-center justify-between gap-2 border border-border px-3 font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
											>
												Reject
												<Cross className="size-3" />
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : null}

				{stage === "executing" ? (
					<div className="flex min-h-38 flex-col justify-center gap-3.5 px-5 py-3.5">
						<p className="text-[clamp(20px,2vw,30px)] leading-tight font-extrabold tracking-[-0.04em] uppercase">
							Executing {approved}{" "}
							{approved === 1 ? "approval" : "approvals"}
						</p>

						<div className="h-px bg-border">
							<span
								className="fx-fill block h-px bg-primary"
								style={
									{ "--fx-duration": `${SETTLE_MS}ms` } as React.CSSProperties
								}
							/>
						</div>

						<p className="fx-eyebrow text-muted">
							Signing under your policy limits · size, venue, counterparty
						</p>
					</div>
				) : null}

				{stage === "settled" ? (
					/* The one light surface on the page. Completion reads as an
					   inversion rather than as yet another dark card. */
					<div className="flex min-h-38 flex-col justify-center gap-3.5 bg-popover px-5 py-3.5 text-popover-foreground">
						{approved > 0 ? (
							<>
								<div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
									<p className="font-mono text-[clamp(22px,2.4vw,34px)] leading-none tracking-tight tabular-nums">
										$
										{(approved * ALLOCATION_PER_DEAL).toLocaleString("en-US")}
									</p>
									<p className="text-[clamp(16px,1.5vw,22px)] font-extrabold tracking-[-0.03em] uppercase">
										allocated across {approved}{" "}
										{approved === 1 ? "position" : "positions"}
									</p>
								</div>

								<p className="fx-eyebrow opacity-70">
									Distributions, covenants and secondary marks now tracked
									continuously
								</p>
							</>
						) : (
							<>
								<p className="text-[clamp(18px,1.9vw,28px)] leading-tight font-extrabold tracking-[-0.035em] uppercase">
									Nothing approved
								</p>
								<p className="fx-eyebrow opacity-70">
									The agent widens the search and returns a new shortlist
								</p>
							</>
						)}

						<button
							type="button"
							onClick={() => {
								setVerdicts(SEED);
								setHasSettled(false);
							}}
							className="fx-eyebrow flex h-9 w-fit cursor-pointer items-center justify-between gap-6 border border-current px-3 font-semibold transition-opacity hover:opacity-70"
						>
							Run it again
							<Check className="size-3" />
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
}
