import { TrackedLink } from "@/app/_components/tracked-link";

import { Arrow, actionClass } from "./ui";

const stats = [
	{ figure: "$31B", label: "Tokenized real-world assets on-chain" },
	{ figure: "167", label: "Issuance platforms, no shared index" },
	{ figure: "3 weeks", label: "Human work to decide one allocation" },
	{ figure: "30 sec", label: "Machine work to settle it" },
];

export function Hero() {
	return (
		<section className="relative border-b border-border">
			<div
				aria-hidden
				className="fx-rules pointer-events-none absolute inset-0"
			/>

			<div className="fx-bleed relative pt-[clamp(56px,7vw,120px)] pb-[clamp(48px,6vw,96px)]">
				<p className="fx-eyebrow flex items-center gap-2.5 text-muted">
					<span className="size-1.5 bg-accent" />
					Agentic infrastructure for real-world assets
				</p>

				<h1 className="fx-display mt-[clamp(32px,4vw,64px)] max-w-[16ch]">
					The decision layer for private markets
				</h1>

				<div className="mt-[clamp(40px,5vw,80px)] grid gap-8 lg:grid-cols-[1fr_2fr_1fr] lg:items-end">
					<p className="fx-eyebrow text-muted lg:col-start-1">
						Discover · Underwrite · Execute · Monitor
					</p>

					<p className="max-w-115 text-pretty text-muted lg:col-start-2">
						AI agents that find, underwrite and execute private-market
						investments on-chain. You set the mandate. The agent runs the
						workflow. You approve the trade.
					</p>

					<div className="flex lg:col-start-3 lg:justify-end">
						<TrackedLink
							href="/dashboard"
							event="cta_click"
							eventParams={{ location: "hero" }}
							className={`${actionClass("solid")} w-full sm:w-auto sm:min-w-56`}
						>
							Request access
							<Arrow />
						</TrackedLink>
					</div>
				</div>
			</div>

			{/* Edge to edge, outside the gutter — the strip reads as the base of
			    the band rather than as content sitting inside it. */}
			<dl className="relative grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<div
						key={stat.figure}
						className="bg-background px-5 py-7"
					>
						<dt className="font-mono text-[clamp(26px,2.6vw,40px)] leading-none font-medium tracking-tight text-accent tabular-nums">
							{stat.figure}
						</dt>
						<dd className="fx-eyebrow mt-3 text-muted">{stat.label}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}
