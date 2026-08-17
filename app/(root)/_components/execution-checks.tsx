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
 */

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
				detail: "Minimum subscription $50,000 exceeds the $25,000 per-allocation limit",
			},
			{ rule: "Venue", ok: true },
			{ rule: "Counterparty", ok: true },
			{ rule: "Asset class", ok: false, detail: "Infrastructure is out of mandate" },
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
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<div>
					<p className="fx-eyebrow text-muted">What gets stopped</p>
					<p className="mt-4 max-w-70 text-pretty text-muted">
						Three candidates against the policy above. The one with the best
						yield is the one that does not make it.
					</p>
				</div>

				<div className="min-w-0 lg:col-span-2">
					<div className="border border-border">
						<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
							<p className="fx-eyebrow text-muted">Policy check · example run</p>
							<p className="fx-eyebrow text-muted">2 passed · 1 blocked</p>
						</div>

						<ul>
							{candidates.map((candidate) => {
								const blocked = candidate.outcome === "blocked";

								return (
									<li
										key={candidate.name}
										className="border-b border-border px-5 py-5 last:border-b-0"
									>
										<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
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

											<div className="flex items-baseline gap-5 font-mono text-sm tabular-nums">
												<span className={blocked ? "text-muted" : "text-accent"}>
													{candidate.yield}
												</span>
												<span className="text-muted">{candidate.size}</span>
											</div>
										</div>

										<ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
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

										{blocked ? (
											<div className="mt-4 border-l-2 border-danger pl-4">
												<p className="fx-eyebrow text-danger">
													Blocked · {candidate.reason}
												</p>
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
										) : (
											<p className="fx-eyebrow mt-4 text-primary">
												Passed · awaiting your approval
											</p>
										)}
									</li>
								);
							})}
						</ul>
					</div>

					<p className="mt-5 text-sm text-pretty text-muted">
						Constructed for illustration — see{" "}
						<a
							href="/disclosures"
							className="text-primary underline underline-offset-4"
						>
							disclosures
						</a>
						. A blocked candidate is not a recommendation withheld; it is a
						trade your own mandate does not permit.
					</p>
				</div>
			</div>
		</section>
	);
}
