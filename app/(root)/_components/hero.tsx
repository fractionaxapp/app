import Link from "next/link";

import { TrackedLink } from "@/app/_components/tracked-link";

import { ApprovalPanel } from "./approval-panel";
import { Arrow, actionClass } from "./ui";

/*
 * Grouped under one neutral heading because the backer/partner split is not
 * settled. Separate into two rows once it is — claiming someone backs you
 * when they are a partner is the kind of error that is expensive to correct.
 */
const supporters = ["SuperteamMY", "Imba Digital"];

export function Hero() {
	return (
		/*
		 * One screen tall, minimum — but capped at 1150px. svh rather than vh so
		 * mobile browser chrome cannot push the last band out of view; 3.5rem is
		 * the sticky header. The content column grows and centres, which pins the
		 * supporters row to the bottom edge.
		 *
		 * The cap matters: without it a very tall window centres ~850px of
		 * content inside 1850px and the whole fold floats in a void. Past the
		 * cap the next band starts showing instead, which reads as a scroll
		 * affordance rather than a mistake.
		 */
		<section className="relative flex min-h-[min(calc(100svh-3.5rem),1150px)] flex-col border-b border-border">
			<div
				aria-hidden
				className="fx-rules pointer-events-none absolute inset-0"
			/>

			<div className="fx-bleed relative flex flex-1 flex-col justify-center pt-[clamp(28px,5.5vh,72px)] pb-[clamp(24px,4vh,56px)]">
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
				<h1 className="fx-display fx-display-fold mt-[clamp(20px,4.4vh,56px)]">
					The agent decides.
					<br />
					You approve.
				</h1>

				<div className="mt-[clamp(28px,5.3vh,68px)] grid gap-8 lg:grid-cols-[1fr_2fr_1fr] lg:items-start">
					<p className="max-w-70 text-[clamp(17px,1.4vw,21px)] leading-[1.35] font-medium text-balance">
						Everyone else tokenizes.{" "}
						<span className="text-accent">We decide.</span>
					</p>

					<p className="max-w-140 text-pretty text-muted">
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
				<div className="mt-[clamp(24px,4.9vh,60px)]">
					<ApprovalPanel />
				</div>
			</div>

			{/* Last band in the fold, so the screen closes on other people's
			    names rather than on our own claims. */}
			<div className="fx-bleed relative flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border py-5">
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
