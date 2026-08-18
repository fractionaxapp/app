/*
 * The strongest thing this page can show is not the agent acting. It is the
 * agent stopped.
 *
 * The blocked candidate is deliberately the most attractive one on the list —
 * the highest yield of the three. An agent that only ever declines the deals
 * you would have declined anyway proves nothing; one that declines a good deal
 * because you told it to is the actual claim.
 *
 * It is also blocked before the shortlist, not after. Nothing you cannot buy
 * should be put in front of you.
 *
 * Each row is a four-track grid — deal, checks, outcome, figures — rather than
 * a left-hand cluster with the numbers pushed to the far edge. Stacked left the
 * row left most of the panel empty and the figures looked unrelated to the deal
 * they belonged to.
 */

import { SectionBar } from "./ui";

type Check = { rule: string; ok: boolean; detail?: string };

type Candidate = {
	name: string;
	origin: string;
	yield: string;
	size: string;
	checks: Check[];
	outcome: "awaiting" | "blocked";
	reason?: string;
};

const candidates: Candidate[] = [
	{
		name: "Receivables pool VII",
		origin: "SG · Trade finance",
		yield: "9.2%",
		size: "$25,000",
		checks: [
			{ rule: "Size", ok: true },
			{ rule: "Venue", ok: true },
			{ rule: "Counterparty", ok: true },
			{ rule: "Asset class", ok: true },
		],
		outcome: "awaiting",
	},
	{
		name: "Jakarta logistics II",
		origin: "ID · Commercial real estate",
		yield: "8.6%",
		size: "$20,000",
		checks: [
			{ rule: "Size", ok: true },
			{ rule: "Venue", ok: true },
			{ rule: "Counterparty", ok: true },
			{ rule: "Asset class", ok: true },
		],
		outcome: "awaiting",
	},
	{
		name: "Danang infrastructure I",
		origin: "VN · Infrastructure",
		yield: "9.8%",
		size: "$50,000",
		checks: [
			{
				rule: "Size",
				ok: false,
				detail:
					"Minimum subscription $50,000 exceeds the $25,000 per-allocation limit",
			},
			{ rule: "Venue", ok: true },
			{ rule: "Counterparty", ok: true },
			{
				rule: "Asset class",
				ok: false,
				detail: "Infrastructure is out of mandate",
			},
		],
		outcome: "blocked",
		reason: "Never reached the shortlist",
	},
];

function Tick({ ok }: { ok: boolean }) {
	return (
		<svg
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden
			className={`size-3 shrink-0 ${ok ? "text-primary" : "text-danger"}`}
		>
			<path
				d={ok ? "M2.5 6.5 5 9l4.5-5.5" : "M3 3l6 6M9 3l-6 6"}
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="square"
			/>
		</svg>
	);
}

export function ExecutionChecks() {
	return (
		<section className="fx-section fx-bleed bg-surface">
			<SectionBar
				label="What gets stopped"
				copy="Three candidates against the policy above. The one with the best yield is the one that does not make it."
			/>

			<div className="mt-10 min-w-0 border border-border">
				<div className="grid gap-x-8 border-b border-border px-5 py-3.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_9rem]">
					<p className="fx-eyebrow text-muted">Policy check · example run</p>
					<p className="fx-eyebrow hidden text-muted lg:block">Rules</p>
					<p className="fx-eyebrow hidden text-muted lg:block">Outcome</p>
					<p className="fx-eyebrow hidden text-right text-muted lg:block">
						2 passed · 1 blocked
					</p>
				</div>

				<ul>
					{candidates.map((candidate) => {
						const blocked = candidate.outcome === "blocked";

						return (
							<li
								key={candidate.name}
								className="border-b border-border px-5 py-5 last:border-b-0"
							>
								<div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_9rem] lg:items-baseline">
									<div>
										<p
											className={`text-sm font-semibold ${
												blocked ? "text-muted line-through" : ""
											}`}
										>
											{candidate.name}
										</p>
										<p className="fx-eyebrow mt-1 text-muted">
											{candidate.origin}
										</p>
									</div>

									<ul className="flex flex-wrap gap-x-5 gap-y-2">
										{candidate.checks.map((check) => (
											<li
												key={check.rule}
												className={`fx-eyebrow flex items-center gap-2 ${
													check.ok ? "text-muted" : "text-danger"
												}`}
											>
												<Tick ok={check.ok} />
												{check.rule}
											</li>
										))}
									</ul>

									<p
										className={`fx-eyebrow ${
											blocked ? "text-danger" : "text-primary"
										}`}
									>
										{blocked ? "Blocked" : "Awaiting your approval"}
									</p>

									<div className="flex items-baseline gap-5 font-mono text-sm tabular-nums lg:justify-end">
										<span className={blocked ? "text-muted" : "text-accent"}>
											{candidate.yield}
										</span>
										<span className="text-muted">{candidate.size}</span>
									</div>
								</div>

								{blocked ? (
									<div className="mt-4 border-l-2 border-danger pl-4">
										<p className="fx-eyebrow text-danger">{candidate.reason}</p>
										<ul className="mt-2 flex flex-col gap-1">
											{candidate.checks
												.filter((check) => !check.ok)
												.map((check) => (
													<li
														key={check.rule}
														className="text-sm text-pretty text-muted"
													>
														{check.detail}
													</li>
												))}
										</ul>
									</div>
								) : null}
							</li>
						);
					})}
				</ul>
			</div>

			<p className="mt-5 max-w-3xl text-sm text-pretty text-muted">
				Constructed for illustration — see{" "}
				<a
					href="/disclosures"
					className="text-primary underline underline-offset-4"
				>
					disclosures
				</a>
				. A blocked candidate is not a recommendation withheld; it is a trade
				your own mandate does not permit.
			</p>
		</section>
	);
}
