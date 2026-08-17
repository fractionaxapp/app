"use client";

import { useEffect, useState } from "react";

/*
 * The product, shown rather than described: one mandate in, a five-stage
 * workflow out. Auto-advances so the whole lifecycle is visible without
 * interaction, and stops for good once the visitor takes control themselves.
 *
 * Each stage draws what it actually does. Five metric lists made five very
 * different jobs look identical — a funnel, a comparison, an eligibility
 * sweep, a split and a schedule are not the same shape, so they are not drawn
 * the same way. The figures are illustrative.
 */

const STEP_DURATION_MS = 4200;

const MANDATE =
	"Private credit yielding 8%+, minimum under $25K, Asia exposure, moderate risk.";

type Visual =
	| { kind: "bars"; items: { label: string; value: string; ratio: number }[] }
	| { kind: "matrix"; total: number; filled: number; caption: string }
	| { kind: "rows"; head: string[]; items: { label: string; values: string[] }[] };

type Step = {
	id: string;
	verb: string;
	title: string;
	description: string;
	note: string;
	visual: Visual;
};

const steps: Step[] = [
	{
		id: "discover",
		verb: "Discover",
		title: "Every tokenized offering, in one index",
		description:
			"167 issuance platforms crawled continuously and normalised into a single schema, so offerings that were never meant to be compared can be.",
		note: "Elapsed 4.1s",
		visual: {
			kind: "bars",
			items: [
				{ label: "Indexed", value: "1,284", ratio: 1 },
				{ label: "Match your mandate", value: "37", ratio: 0.029 },
			],
		},
	},
	{
		id: "underwrite",
		verb: "Underwrite",
		title: "Every deal read the same way",
		description:
			"Offering memos, term sheets and payment histories parsed into one field set — so thirty-seven PDFs become thirty-seven comparable rows.",
		note: "3 flags raised",
		visual: {
			kind: "rows",
			head: ["Net", "DSCR"],
			items: [
				{ label: "Receivables pool VII", values: ["9.2%", "1.8×"] },
				{ label: "Jakarta logistics II", values: ["8.6%", "1.5×"] },
				{ label: "SME bridge facility", values: ["8.1%", "1.6×"] },
			],
		},
	},
	{
		id: "eligibility",
		verb: "Qualify",
		title: "Cleared once, not once per issuer",
		description:
			"Your identity, jurisdiction and accreditation resolved against each issuer's rules up front — before you fill in a single form.",
		note: "0 re-verifications",
		visual: {
			kind: "matrix",
			total: 37,
			filled: 21,
			caption: "Eligible at 21 of 37 issuers",
		},
	},
	{
		id: "execute",
		verb: "Execute",
		title: "You approve. The agent settles",
		description:
			"Execution runs inside policy limits you set — size, venue and counterparty. The agent cannot step outside the mandate it was given.",
		note: "Settled in 34s",
		visual: {
			kind: "bars",
			items: [
				{ label: "Receivables pool VII", value: "$10,000", ratio: 0.4 },
				{ label: "Jakarta logistics II", value: "$8,000", ratio: 0.32 },
				{ label: "SME bridge facility", value: "$7,000", ratio: 0.28 },
			],
		},
	},
	{
		id: "monitor",
		verb: "Monitor",
		title: "The position keeps being watched",
		description:
			"Distributions, covenants and secondary marks tracked continuously by the same model that underwrote the deal in the first place.",
		note: "NAV +0.7% month to date",
		visual: {
			kind: "rows",
			head: ["Due"],
			items: [
				{ label: "Coupon · Receivables VII", values: ["Sep 1"] },
				{ label: "Covenant test · Jakarta II", values: ["Sep 30"] },
				{ label: "Mark refresh · all positions", values: ["Daily"] },
			],
		},
	},
];

function Bars({ items }: { items: Extract<Visual, { kind: "bars" }>["items"] }) {
	return (
		<ul className="flex flex-col gap-5">
			{items.map((item) => (
				<li key={item.label}>
					<div className="flex items-baseline justify-between gap-4">
						<span className="fx-eyebrow text-muted">{item.label}</span>
						<span className="font-mono text-lg tracking-tight text-accent tabular-nums">
							{item.value}
						</span>
					</div>

					<div className="mt-2.5 h-1.5 bg-border">
						{/* A 3% bar is nearly invisible, which is the point of this one —
						    min-width keeps it rendered rather than rounded away. */}
						<div
							className="h-full min-w-0.5 bg-accent"
							style={{ width: `${item.ratio * 100}%` }}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}

function Matrix({
	total,
	filled,
	caption,
}: Extract<Visual, { kind: "matrix" }>) {
	return (
		<div>
			<ul
				aria-hidden
				className="flex flex-wrap gap-1.5"
			>
				{Array.from({ length: total }, (_, index) => (
					<li
						key={index}
						className={`size-3.5 ${
							index < filled ? "bg-accent" : "border border-border"
						}`}
					/>
				))}
			</ul>

			<p className="fx-eyebrow mt-5 text-muted">{caption}</p>
		</div>
	);
}

function Rows({ head, items }: Extract<Visual, { kind: "rows" }>) {
	return (
		<table className="w-full border-collapse text-left">
			<thead>
				<tr>
					<th className="fx-eyebrow pb-3 font-normal text-muted">Deal</th>
					{head.map((column) => (
						<th
							key={column}
							className="fx-eyebrow pb-3 text-right font-normal text-muted"
						>
							{column}
						</th>
					))}
				</tr>
			</thead>

			<tbody>
				{items.map((row) => (
					<tr key={row.label} className="border-t border-border">
						<td className="py-3 pr-4 text-sm">{row.label}</td>
						{row.values.map((value) => (
							<td
								key={value}
								className="py-3 text-right font-mono text-sm text-accent tabular-nums"
							>
								{value}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function StageVisual({ visual }: { visual: Visual }) {
	if (visual.kind === "bars") return <Bars items={visual.items} />;
	if (visual.kind === "matrix") return <Matrix {...visual} />;
	return <Rows {...visual} />;
}

export function MandateConsole() {
	const [activeIndex, setActiveIndex] = useState(0);

	/*
	 * One timeout per step rather than a repeating interval, keyed on the step
	 * itself. Picking a stage therefore restarts the clock from there and the
	 * run carries on, instead of stopping the walkthrough for good — choosing
	 * where to look should not be the same gesture as switching it off.
	 */
	useEffect(() => {
		// Auto-advance is decoration; honour a stated preference against it.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const timer = window.setTimeout(
			() => setActiveIndex((index) => (index + 1) % steps.length),
			STEP_DURATION_MS,
		);

		return () => window.clearTimeout(timer);
	}, [activeIndex]);

	const active = steps[activeIndex];

	return (
		<div className="border border-border bg-surface">
			<div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
				<p className="fx-eyebrow text-muted">Mandate · live</p>

				<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
					<span className="relative flex size-1.5">
						<span className="absolute inline-flex size-full animate-ping bg-primary opacity-70" />
						<span className="relative inline-flex size-1.5 bg-primary" />
					</span>
					Running
				</p>
			</div>

			<div className="border-b border-border px-5 py-6">
				<p className="fx-eyebrow text-muted">You said</p>
				<p className="mt-3 font-mono text-[clamp(14px,1.35vw,20px)] leading-relaxed text-pretty">
					<span className="text-accent">&gt;</span> {MANDATE}
				</p>
			</div>

			{/*
			 * Five equal segments rather than a row of words over one long bar.
			 * Each stage now owns its own rail, so completed, running and not
			 * started are legible at a glance instead of inferred from one
			 * bar's position.
			 */}
			<div className="grid gap-px border-b border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
				{steps.map((step, index) => {
					const isActive = index === activeIndex;
					const isDone = index < activeIndex;

					return (
						<button
							key={step.id}
							type="button"
							onClick={() => setActiveIndex(index)}
							data-active={isActive}
							aria-current={isActive ? "step" : undefined}
							className="group flex cursor-pointer flex-col gap-3 bg-surface px-4 py-4 text-left transition-colors hover:bg-surface-muted"
						>
							<span
								className={`fx-eyebrow tabular-nums ${
									isActive || isDone ? "text-primary" : "text-muted"
								}`}
							>
								{String(index + 1).padStart(2, "0")}
							</span>

							<span className="fx-outline text-[clamp(17px,1.9vw,30px)] leading-none font-extrabold tracking-[-0.045em] uppercase">
								{step.verb}
							</span>

							<span className="mt-auto block h-px bg-border">
								{isDone ? <span className="block h-px bg-primary" /> : null}
								{isActive ? (
									// Keyed so advancing remounts it and the fill restarts.
									<span
										key={activeIndex}
										className="fx-fill block h-px bg-primary"
										style={
											{
												"--fx-duration": `${STEP_DURATION_MS}ms`,
											} as React.CSSProperties
										}
									/>
								) : null}
							</span>
						</button>
					);
				})}
			</div>

			<div className="grid gap-px bg-border lg:grid-cols-[0.9fr_1.1fr]">
				<div className="bg-surface px-5 py-7">
					<h3 className="text-[clamp(20px,2vw,30px)] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance uppercase">
						{active.title}
					</h3>
					<p className="mt-4 max-w-125 text-pretty text-muted">
						{active.description}
					</p>
				</div>

				<div className="flex flex-col justify-between gap-6 bg-surface px-5 py-7">
					<StageVisual visual={active.visual} />

					<p className="fx-eyebrow border-t border-border pt-4 text-muted">
						{active.note}
					</p>
				</div>
			</div>
		</div>
	);
}
