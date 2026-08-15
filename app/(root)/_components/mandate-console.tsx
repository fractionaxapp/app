"use client";

import { useEffect, useState } from "react";

/*
 * The product, shown rather than described: one mandate in, a five-stage
 * workflow out. Auto-advances so the whole lifecycle is visible without
 * interaction, and stops for good once the visitor takes control themselves.
 */

const STEP_DURATION_MS = 3800;

const MANDATE =
	"Private credit yielding 8%+, minimum under $25K, Asia exposure, moderate risk.";

const steps = [
	{
		id: "discover",
		verb: "Discover",
		title: "Every tokenized offering, in one index",
		description:
			"167 issuance platforms crawled continuously and normalised into a single schema, so offerings that were never meant to be compared can be.",
		metrics: [
			{ label: "Offerings live", value: "1,284" },
			{ label: "Match mandate", value: "37" },
			{ label: "Elapsed", value: "4.1s" },
		],
	},
	{
		id: "underwrite",
		verb: "Underwrite",
		title: "Every deal read the same way",
		description:
			"Offering memos, term sheets and payment histories parsed into one field set — so thirty-seven PDFs become thirty-seven comparable rows.",
		metrics: [
			{ label: "Median net yield", value: "8.4%" },
			{ label: "Median DSCR", value: "1.62×" },
			{ label: "Flags raised", value: "3" },
		],
	},
	{
		id: "eligibility",
		verb: "Qualify",
		title: "Cleared once, not once per issuer",
		description:
			"Your identity, jurisdiction and accreditation resolved against each issuer's rules up front — before you fill in a single form.",
		metrics: [
			{ label: "Eligible", value: "21 / 37" },
			{ label: "Re-verifications", value: "0" },
			{ label: "Standing", value: "Accredited" },
		],
	},
	{
		id: "execute",
		verb: "Execute",
		title: "You approve. The agent settles",
		description:
			"Execution runs inside policy limits you set — size, venue, counterparty. The agent cannot step outside the mandate it was given.",
		metrics: [
			{ label: "Allocated", value: "$25,000" },
			{ label: "Positions", value: "3" },
			{ label: "Settlement", value: "34s" },
		],
	},
	{
		id: "monitor",
		verb: "Monitor",
		title: "The position keeps being watched",
		description:
			"Distributions, covenants and secondary marks tracked continuously by the same model that underwrote the deal in the first place.",
		metrics: [
			{ label: "Next coupon", value: "Sep 1" },
			{ label: "Covenants", value: "Pass" },
			{ label: "NAV, month to date", value: "+0.7%" },
		],
	},
];

export function MandateConsole() {
	const [activeIndex, setActiveIndex] = useState(0);
	const [isAuto, setIsAuto] = useState(true);

	useEffect(() => {
		if (!isAuto) return;

		// Auto-advance is decoration; honour a stated preference against it.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const timer = window.setInterval(
			() => setActiveIndex((index) => (index + 1) % steps.length),
			STEP_DURATION_MS,
		);

		return () => window.clearInterval(timer);
	}, [isAuto]);

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

			{/* The five stages as hollow type that fills when the agent reaches it. */}
			<div className="border-b border-border">
				<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-6 sm:gap-x-9">
					{steps.map((step, index) => (
						<button
							key={step.id}
							type="button"
							onClick={() => {
								setActiveIndex(index);
								setIsAuto(false);
							}}
							data-active={index === activeIndex}
							aria-current={index === activeIndex ? "step" : undefined}
							// Sized so all five verbs hold one line from tablet up.
							className="fx-outline cursor-pointer text-[clamp(20px,2.6vw,42px)] leading-none font-extrabold tracking-[-0.05em] uppercase"
						>
							{step.verb}
						</button>
					))}
				</div>

				<div className="h-px bg-border">
					{/* Keyed so advancing remounts it and the fill restarts. */}
					<span
						key={activeIndex}
						className="fx-fill block h-px bg-primary"
						style={
							{ "--fx-duration": `${STEP_DURATION_MS}ms` } as React.CSSProperties
						}
					/>
				</div>
			</div>

			<div className="grid gap-px bg-border lg:grid-cols-[1.1fr_1fr]">
				<div className="bg-surface px-5 py-7">
					<p className="fx-eyebrow text-accent tabular-nums">
						{String(activeIndex + 1).padStart(2, "0")} / 05
					</p>
					<h3 className="mt-4 text-[clamp(20px,2vw,30px)] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance uppercase">
						{active.title}
					</h3>
					<p className="mt-4 max-w-125 text-pretty text-muted">
						{active.description}
					</p>
				</div>

				<dl className="grid gap-px bg-border sm:grid-cols-3 lg:grid-cols-1">
					{active.metrics.map((metric) => (
						<div
							key={metric.label}
							className="flex flex-col justify-center bg-surface px-5 py-5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-4"
						>
							<dt className="fx-eyebrow text-muted">{metric.label}</dt>
							<dd className="mt-2 font-mono text-xl tracking-tight text-foreground tabular-nums lg:mt-0">
								{metric.value}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</div>
	);
}
