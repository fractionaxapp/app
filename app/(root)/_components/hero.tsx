import Link from "next/link";

import { TrackedLink } from "@/app/_components/tracked-link";

import { ApprovalPanel } from "./approval-panel";
import { Arrow, actionClass } from "./ui";

/*
 * Two cited market facts and two product truths. Nothing here is a measured
 * product metric — no "nine minutes" until there is a real number behind it.
 */
const stats = [
	{ figure: "$31B", label: "Tokenized real-world assets on-chain" },
	{ figure: "167", label: "Issuance platforms under coverage" },
	{ figure: "$25,000", label: "Minimum allocation" },
	{ figure: "Your call", label: "Approve each trade, or let it run" },
];

/*
 * Grouped under one neutral heading because the backer/partner split is not
 * settled. Separate into two rows once it is — claiming someone backs you
 * when they are a partner is the kind of error that is expensive to correct.
 */
const supporters = ["SuperteamMY", "Imba Digital"];

export function Hero() {
	return (
		/*
		 * One screen tall, minimum. svh rather than vh so mobile browser chrome
		 * cannot push the last band out of view; 3.5rem is the sticky header.
		 * The content column grows and centres, which pins the stat strip and
		 * the supporters row to the bottom edge on any taller viewport.
		 */
		<section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col border-b border-border">
			<div
				aria-hidden
				className="fx-rules pointer-events-none absolute inset-0"
			/>

			<div className="fx-bleed relative flex flex-1 flex-col justify-center py-[clamp(20px,2.5vh,44px)]">
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
					<p className="fx-eyebrow flex items-center gap-2.5 text-muted">
						<span className="size-1.5 bg-accent" />
						AI agents for private-market investing
					</p>

					<p className="fx-eyebrow border border-accent px-2.5 py-1 text-accent">
						Private beta
					</p>
				</div>

				{/* The position in six words. The second sentence answers the flinch
				    the first one provokes, which is why they must stay together. */}
				<h1 className="fx-display fx-display-fold mt-[clamp(14px,1.8vh,32px)]">
					The agent decides.
					<br />
					You approve.
				</h1>

				<div className="mt-[clamp(20px,2.6vh,40px)] grid gap-8 lg:grid-cols-[1fr_2fr_1fr] lg:items-start">
					<p className="max-w-70 text-[clamp(17px,1.4vw,21px)] leading-[1.35] font-medium text-balance">
						Everyone else tokenizes.{" "}
						<span className="text-accent">We decide.</span>
					</p>

					<p className="max-w-115 text-pretty text-muted">
						Our agents search every tokenized offering, underwrite the ones that
						fit your mandate and clear your eligibility — then bring you a
						shortlist to approve. From $25,000.
					</p>

					<div className="flex flex-col gap-3 lg:items-end">
						<TrackedLink
							href="/dashboard"
							event="cta_click"
							eventParams={{ location: "hero" }}
							className={`${actionClass("solid")} w-full`}
						>
							Join the private beta
							<Arrow />
						</TrackedLink>

						<Link
							href="/#workflow"
							className={`${actionClass("ghost")} w-full`}
						>
							See a live mandate
							<Arrow />
						</Link>

						<p className="fx-eyebrow mt-1 text-muted lg:text-right">
							Accredited investors and allocators
						</p>
					</div>
				</div>

				{/* The headline, made literal. */}
				<div className="mt-[clamp(20px,2.6vh,40px)]">
					<ApprovalPanel />
				</div>
			</div>

			{/*
			  * Full bleed, so the rules reach the screen edge — but each cell
			  * carries the gutter as its own left padding. That keeps the first
			  * figure in the same column as the headline above it, and gives
			  * every other figure the same offset from its own divider.
			  */}
			<dl className="relative grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<div
						key={stat.figure}
						className="bg-background py-4 pr-5 pl-[var(--gutter)]"
					>
						<dt className="font-mono text-[clamp(20px,2vw,32px)] leading-none font-medium tracking-tight text-accent tabular-nums">
							{stat.figure}
						</dt>
						<dd className="fx-eyebrow mt-2 text-muted">{stat.label}</dd>
					</div>
				))}
			</dl>

			{/* Last band in the fold, so the screen closes on other people's
			    names rather than on our own claims. */}
			<div className="fx-bleed relative flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border py-3.5">
				<p className="fx-eyebrow text-muted">Backed by and building with</p>

				{/* Not uppercased, unlike everything else here: these are other
				    people's names, and "SuperteamMY" loses its country in caps. */}
				{supporters.map((name) => (
					<span
						key={name}
						className="text-base font-extrabold tracking-[-0.03em]"
					>
						{name}
					</span>
				))}
			</div>
		</section>
	);
}
