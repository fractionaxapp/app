"use client";

import { useState } from "react";

import { TrackedLink } from "@/app/_components/tracked-link";

import { Arrow, actionClass } from "./ui";

/*
 * The closing call to action, and a demonstration in itself: rather than
 * collecting details about the visitor, it has them state a mandate in the
 * product's own terms and carries it through to the dashboard.
 *
 * Deliberately no personal fields — the sign-in flow already asks for what it
 * needs, and a landing page has no business holding any of it.
 */

const fields = [
	{
		id: "asset",
		label: "Asset class",
		options: [
			"Private credit",
			"Commercial real estate",
			"Trade finance",
			"Infrastructure",
			"Treasuries",
		],
	},
	{
		id: "yield",
		label: "Target yield",
		options: ["6%+", "8%+", "10%+", "12%+"],
	},
	{
		id: "minimum",
		label: "Minimum",
		options: ["under $10K", "under $25K", "under $100K", "no limit"],
	},
	{
		id: "region",
		label: "Exposure",
		options: ["Asia", "North America", "Europe", "Latin America", "Global"],
	},
	{
		id: "risk",
		label: "Risk",
		options: ["conservative", "moderate", "opportunistic"],
	},
] as const;

type FieldId = (typeof fields)[number]["id"];

const defaults: Record<FieldId, string> = {
	asset: "Private credit",
	yield: "8%+",
	minimum: "under $25K",
	region: "Asia",
	risk: "moderate",
};

/*
 * Sits on the base background so the FAQ band above it reads as separate; the
 * fields keep bg-surface and now sit raised against it.
 */
export function MandateComposer() {
	const [values, setValues] = useState(defaults);

	const mandate = `${values.asset} yielding ${values.yield}, minimum ${values.minimum}, ${values.region} exposure, ${values.risk} risk.`;

	return (
		<section id="start" className="fx-section fx-bleed scroll-mt-14">
			<div className="grid items-start gap-8 lg:grid-cols-[1fr_2fr_1fr]">
				<p className="fx-eyebrow text-muted">Get started</p>

				<h2 className="fx-heading">What are you trying to allocate?</h2>

				<p className="max-w-115 text-pretty text-muted lg:mt-2">
					State it the way you would to an analyst. That sentence is the whole
					interface — the agent takes it from there.
				</p>
			</div>

			<div className="mt-[clamp(48px,6vw,96px)] grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
				{fields.map((field) => (
					<div key={field.id} className="bg-surface px-5 py-5">
						<label
							htmlFor={`mandate-${field.id}`}
							className="fx-eyebrow block text-muted"
						>
							{field.label}
						</label>

						<div className="relative mt-3">
							<select
								id={`mandate-${field.id}`}
								value={values[field.id]}
								onChange={(event) =>
									setValues((current) => ({
										...current,
										[field.id]: event.target.value,
									}))
								}
								className="w-full cursor-pointer appearance-none border-0 bg-transparent pr-7 font-mono text-base tracking-tight text-foreground focus:outline-none focus-visible:text-primary"
							>
								{field.options.map((option) => (
									<option key={option} value={option} className="bg-surface">
										{option}
									</option>
								))}
							</select>

							<svg
								viewBox="0 0 12 12"
								aria-hidden
								className="pointer-events-none absolute top-1/2 right-0 size-3 -translate-y-1/2 text-primary"
							>
								<path
									d="M2 4.5 6 8.5 10 4.5"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
								/>
							</svg>
						</div>
					</div>
				))}
			</div>

			<div className="grid gap-px bg-border lg:grid-cols-[2fr_1fr]">
				<p
					aria-live="polite"
					className="bg-surface px-5 py-7 font-mono text-[clamp(15px,1.5vw,22px)] leading-relaxed text-pretty"
				>
					<span className="text-accent">&gt;</span> {mandate}
				</p>

				<div className="flex items-stretch bg-surface">
					<TrackedLink
						href={`/dashboard?mandate=${encodeURIComponent(mandate)}`}
						event="cta_click"
						eventParams={{ location: "composer" }}
						className={`${actionClass("solid")} m-5 flex-1`}
					>
						Run this mandate
						<Arrow />
					</TrackedLink>
				</div>
			</div>
		</section>
	);
}
