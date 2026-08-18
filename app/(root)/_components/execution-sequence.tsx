/*
 * What happens between pressing approve and owning the thing. The page said
 * "settlement on-chain" and left the middle invisible, which is the part
 * anyone moving real money actually wants to see.
 *
 * The order matters more than the timings. Eligibility is re-confirmed at the
 * moment of execution rather than trusted from the shortlist, because
 * circumstances change between a deal being listed and a trade being placed,
 * and nothing is committed until after that check passes.
 */

import { SectionBar } from "./ui";

const steps = [
	{
		label: "Approval recorded",
		detail: "Your decision, timestamped and attributable",
		at: "0s",
		committed: false,
	},
	{
		label: "Eligibility re-confirmed",
		detail: "Checked with the issuer again, not trusted from the shortlist",
		at: "2s",
		committed: false,
	},
	{
		label: "Allocation reserved",
		detail: "The issuer holds the size against your account",
		at: "4s",
		committed: false,
	},
	{
		label: "Transfer signed and broadcast",
		detail: "Funds leave your wallet — the first irreversible step",
		at: "9s",
		committed: true,
	},
	{
		label: "Settlement final on-chain",
		detail: "Confirmed to the depth the venue requires",
		at: "34s",
		committed: true,
	},
	{
		label: "Position opened",
		detail: "Recorded against the mandate, and monitoring begins",
		at: "34s",
		committed: true,
	},
];

export function ExecutionSequence() {
	return (
		<section className="fx-section fx-bleed">
			<SectionBar
				label="After you approve"
				copy="Six steps between the decision and the position. Only three of them can cost you anything."
			/>

			<div className="mt-10 min-w-0">
				<div className="border border-border bg-surface">
					<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
						<p className="fx-eyebrow text-muted">Settlement sequence</p>
						<p className="fx-eyebrow text-accent">Example run · 34s</p>
					</div>

					<ol className="px-5 py-2">
						{steps.map((step, index) => (
							<li key={step.label} className="flex gap-4 py-3.5">
								<div className="relative flex w-1.5 shrink-0 justify-center">
									<span
										aria-hidden
										className="absolute inset-y-[-0.875rem] w-px bg-border"
									/>
									<span
										aria-hidden
										className={`relative mt-1.5 size-1.5 shrink-0 ${
											step.committed ? "bg-accent" : "bg-primary"
										}`}
									/>
								</div>

								<div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
									<div>
										<p className="flex flex-wrap items-baseline gap-x-3">
											<span className="fx-eyebrow text-muted tabular-nums">
												{String(index + 1).padStart(2, "0")}
											</span>
											<span className="text-sm">{step.label}</span>
										</p>
										<p className="mt-1 text-sm text-muted">{step.detail}</p>
									</div>

									<p className="font-mono text-sm text-muted tabular-nums">
										{step.at}
									</p>
								</div>
							</li>
						))}
					</ol>

					<div className="flex gap-3 border-t border-border bg-accent/[0.06] px-5 py-4">
						<span aria-hidden className="mt-0.5 text-accent">
							!
						</span>
						<p className="text-sm text-pretty text-muted">
							<strong className="font-semibold text-foreground">
								Nothing is committed before step four.
							</strong>{" "}
							A failure in the first three stops the sequence and costs you
							nothing. After the transfer is broadcast the trade is on-chain
							and, like any on-chain transfer, not something we can take back.
						</p>
					</div>
				</div>

				<p className="mt-5 text-sm text-muted">
					Timings from an example run — see{" "}
					<a
						href="/disclosures"
						className="text-primary underline underline-offset-4"
					>
						disclosures
					</a>
					. Settlement speed depends on the venue and the chain.
				</p>
			</div>
		</section>
	);
}
