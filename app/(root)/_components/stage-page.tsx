import Link from "next/link";

import { TrackedLink } from "@/app/_components/tracked-link";

import { nextStage, stages, type Stage } from "./stages";
import { Arrow, SectionBar, actionClass } from "./ui";

/*
 * One frame for all four stage pages. They share a shape deliberately: someone
 * arriving on Underwrite from a search result should be able to move to Execute
 * without relearning the page.
 *
 * The stage rail across the top is the same device as the workflow console —
 * the current stage solid, the others hollow — so a page reached directly still
 * shows where it sits in the sequence.
 */
export function StagePage({
	stage,
	children,
}: {
	stage: Stage;
	/** Bespoke sections for this stage, placed after "How it works". */
	children?: React.ReactNode;
}) {
	const index = stages.findIndex((item) => item.slug === stage.slug);
	const next = nextStage(stage.slug);

	return (
		<>
			<section className="relative border-b border-border">
				<div
					aria-hidden
					className="fx-rules pointer-events-none absolute inset-0"
				/>

				<div className="fx-bleed relative py-[clamp(40px,5vw,88px)]">
					<p className="fx-eyebrow flex items-center gap-2.5 text-muted">
						<span className="text-accent tabular-nums">
							{String(index + 1).padStart(2, "0")} /{" "}
							{String(stages.length).padStart(2, "0")}
						</span>
						{stage.verb}
					</p>

					<h1 className="fx-display mt-[clamp(20px,2.6vh,44px)] max-w-[18ch]">
						{stage.title}
					</h1>

					<div className="mt-[clamp(28px,3.4vh,56px)] grid gap-8 lg:grid-cols-[1fr_2fr_1fr] lg:items-start">
						{/* Sans for the chore, not the eyebrow's mono. Mono under a
						    strikethrough is dense enough to stop being readable. */}
						<div className="lg:col-start-1">
							<p className="fx-eyebrow text-muted">Instead of</p>
							<p className="mt-3 max-w-70 text-pretty text-muted/80">
								<s className="decoration-muted/50">{stage.chore}</s>
							</p>
						</div>

						<p className="max-w-140 text-pretty text-muted lg:col-start-2">
							{stage.summary}
						</p>

						<div className="flex flex-col gap-3 lg:col-start-3 lg:items-end">
							<TrackedLink
								href="/dashboard"
								event="cta_click"
								eventParams={{ location: `stage_${stage.slug}` }}
								className={`${actionClass("solid")} w-full`}
							>
								Join the private beta
								<Arrow />
							</TrackedLink>

							<Link
								href="/#workflow"
								className={`${actionClass("ghost")} w-full`}
							>
								See the whole workflow
								<Arrow />
							</Link>
						</div>
					</div>
				</div>

				{/* Where this stage sits. Reached directly, this is the only context. */}
				<nav
					aria-label="Workflow stages"
					className="relative grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
				>
					{stages.map((item, itemIndex) => {
						const isCurrent = item.slug === stage.slug;

						return (
							<Link
								key={item.slug}
								href={`/${item.slug}`}
								aria-current={isCurrent ? "page" : undefined}
								className="group flex flex-col gap-3 bg-background px-5 py-5 transition-colors hover:bg-surface"
							>
								<span
									className={`fx-eyebrow tabular-nums ${
										itemIndex <= index ? "text-primary" : "text-muted"
									}`}
								>
									{String(itemIndex + 1).padStart(2, "0")}
								</span>

								<span
									data-active={isCurrent}
									className="fx-outline text-[clamp(18px,2vw,32px)] leading-none font-extrabold tracking-[-0.045em] uppercase"
								>
									{item.verb}
								</span>
							</Link>
						);
					})}
				</nav>
			</section>

			{/*
			 * Three abreast rather than a vertical list in a middle column. As a
			 * list it left both outer thirds of the page empty for its whole
			 * height, and the three points are peers — stacking them implied a
			 * sequence that does not exist.
			 */}
			<section className="fx-section fx-bleed">
				<SectionBar label="How it works" />

				<ol className="mt-10 grid gap-px bg-border md:grid-cols-3">
					{stage.points.map((point, pointIndex) => (
						<li
							key={point.title}
							className="flex flex-col gap-4 bg-background px-5 py-7 sm:px-7"
						>
							<span className="fx-eyebrow text-accent tabular-nums">
								{String(pointIndex + 1).padStart(2, "0")}
							</span>

							<h2 className="text-[clamp(18px,1.7vw,25px)] leading-tight font-extrabold tracking-[-0.035em] text-balance uppercase">
								{point.title}
							</h2>

							<p className="text-pretty text-muted">{point.body}</p>
						</li>
					))}
				</ol>
			</section>

			{children}

			<section className="fx-section fx-bleed bg-surface">
				<SectionBar label="In numbers" />

				<dl className="mt-10 grid gap-px bg-border sm:grid-cols-3">
					{stage.figures.map((figure) => (
						<div key={figure.label} className="bg-surface px-5 py-8 sm:px-7">
							<dt className="font-mono text-[clamp(28px,3.4vw,52px)] leading-none font-medium tracking-tight text-accent tabular-nums">
								{figure.value}
							</dt>
							<dd className="fx-eyebrow mt-4 text-muted">{figure.label}</dd>
						</div>
					))}
				</dl>

				{stage.illustrative ? (
					<p className="mt-5 max-w-3xl text-sm text-muted">
						Figures from an example run, shown to illustrate the shape of the
						output. See{" "}
						<a
							href="/disclosures"
							className="text-primary underline underline-offset-4"
						>
							disclosures
						</a>
						.
					</p>
				) : null}
			</section>

			{/* The chain. The last stage sends you to the composer instead. */}
			<section className="fx-section fx-bleed">
				<div className="grid gap-x-8 gap-y-8 lg:grid-cols-[1fr_2fr_1fr]">
					<p className="fx-eyebrow text-muted">
						{next ? "Next" : "Get started"}
					</p>

					<div>
						<h2 className="fx-heading max-w-[16ch]">
							{next ? next.title : "What are you trying to allocate?"}
						</h2>

						<div className="mt-8">
							<Link
								href={next ? `/${next.slug}` : "/#start"}
								className={`${actionClass("solid")} w-full sm:w-auto sm:min-w-72`}
							>
								{next ? next.verb : "Compose a mandate"}
								<Arrow />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
