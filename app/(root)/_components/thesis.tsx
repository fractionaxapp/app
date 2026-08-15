import { SectionHeading } from "./ui";

const shifts = [
	{
		title: "Supply exists",
		body: (
			<>
				<span className="text-foreground">$31B</span> of real-world assets are
				already tokenized on-chain — roughly{" "}
				<span className="text-foreground">3×</span> in a year.
			</>
		),
		source: "rwa.xyz",
	},
	{
		title: "Settlement works",
		body: (
			<>
				Regulated funds now trade with{" "}
				<span className="text-foreground">
					public settlement on public chains
				</span>
				, not inside a walled sandbox.
			</>
		),
		source: "DTCC tokenization pilot",
	},
	{
		title: "Agents can transact",
		body: (
			<>
				Wallets, policy controls and{" "}
				<span className="text-foreground">payment standards have shipped</span>{" "}
				for autonomous counterparties.
			</>
		),
		source: "x402 Foundation · Linux Foundation",
	},
];

export function Thesis() {
	return (
		<section id="why-now" className="fx-section fx-bleed scroll-mt-14">
			<SectionHeading
				eyebrow="Why now"
				title="Three things became true in eighteen months"
				copy="Supply, settlement and autonomy all arrived at once. The layer that decides what to buy did not."
			/>

			<div className="mt-[clamp(48px,6vw,96px)] grid gap-px bg-border md:grid-cols-3">
				{shifts.map((shift, index) => (
					<article
						key={shift.title}
						className="flex flex-col gap-6 bg-background p-6 sm:p-8"
					>
						<span className="fx-eyebrow text-accent tabular-nums">
							{String(index + 1).padStart(2, "0")}
						</span>

						<h3 className="text-[clamp(24px,2.4vw,36px)] leading-[1.02] font-extrabold tracking-[-0.045em] uppercase">
							{shift.title}
						</h3>

						<p className="flex-1 text-pretty text-muted">{shift.body}</p>

						<p className="fx-eyebrow border-t border-border pt-5 text-muted">
							{shift.source}
						</p>
					</article>
				))}
			</div>

			<p className="mt-[clamp(40px,5vw,72px)] max-w-4xl text-[clamp(20px,2vw,32px)] leading-[1.25] text-pretty">
				So supply exists, settlement works, and agents can transact.{" "}
				<span className="text-muted">
					Nobody had built the layer that decides what to buy.
				</span>
			</p>
		</section>
	);
}
