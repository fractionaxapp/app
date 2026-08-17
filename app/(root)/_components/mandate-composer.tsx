"use client";

import { useState } from "react";

import { TrackedLink } from "@/app/_components/tracked-link";

import { Arrow, actionClass } from "./ui";

/*
 * The closing call to action, and a demonstration in itself.
 *
 * The section claims the sentence is the whole interface, so the sentence is
 * the whole interface: every variable in it is editable in place. Five
 * labelled dropdowns above a read-only summary said the opposite — that the
 * form was the interface and the sentence was its receipt.
 *
 * Deliberately no personal fields. The sign-in flow already asks for what it
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
 * A real <select>, not a cycling button — options stay browsable, the keyboard
 * works, and screen readers get the right role. field-sizing shrinks it to the
 * chosen value so it sits in the sentence as a word rather than reserving room
 * for the longest option; without support it simply runs a little wide.
 *
 * Declared at module scope, not inside the section. A component defined during
 * render is a new type on every render, so React would tear down and rebuild
 * each select the moment a value changed — losing focus mid-interaction.
 */
function Slot({
	id,
	value,
	onChange,
}: {
	id: FieldId;
	value: string;
	onChange: (id: FieldId, value: string) => void;
}) {
	const field = fields.find((item) => item.id === id);
	if (!field) return null;

	return (
		<span className="relative inline-block">
			<label htmlFor={`mandate-${field.id}`} className="sr-only">
				{field.label}
			</label>

			<select
				id={`mandate-${field.id}`}
				value={value}
				onChange={(event) => onChange(field.id, event.target.value)}
				className="[field-sizing:content] cursor-pointer appearance-none border-b border-dashed border-primary/60 bg-primary/8 pr-[1.1em] pl-[0.2em] pb-0.5 text-primary transition-colors hover:border-primary hover:bg-primary/20 focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none"
			>
				{field.options.map((option) => (
					<option
						key={option}
						value={option}
						className="bg-surface text-foreground"
					>
						{option}
					</option>
				))}
			</select>

			{/*
			 * Put back the caret that appearance-none removed. It is the one cue
			 * for a select that every user already knows, and the only one that
			 * survives on touch — cursor changes and hover borders do not.
			 * Sized in em so it tracks the sentence rather than fighting it.
			 */}
			<svg
				viewBox="0 0 12 12"
				fill="none"
				aria-hidden
				className="pointer-events-none absolute top-1/2 right-[0.25em] size-[0.45em] -translate-y-1/2 text-primary"
			>
				<path
					d="M2 4.5 6 8.5 10 4.5"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="square"
				/>
			</svg>
		</span>
	);
}

export function MandateComposer() {
	const [values, setValues] = useState(defaults);

	const mandate = `${values.asset} yielding ${values.yield}, minimum ${values.minimum}, ${values.region} exposure, ${values.risk} risk.`;

	const update = (id: FieldId, value: string) =>
		setValues((current) => ({ ...current, [id]: value }));

	return (
		<section id="start" className="fx-section fx-bleed scroll-mt-14">
			<div className="grid items-start gap-8 lg:grid-cols-[1fr_2fr_1fr]">
				<p className="fx-eyebrow text-muted">Get started</p>

				<h2 className="fx-heading">What are you trying to allocate?</h2>

				<p className="max-w-115 text-pretty text-muted lg:mt-2">
					State it the way you would to an analyst. That sentence is the whole
					interface — change any part of it below.
				</p>
			</div>

			<div className="mt-[clamp(48px,6vw,96px)] border border-border bg-surface">
				<div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">Your mandate</p>

					<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
						<span aria-hidden className="size-1.5 bg-primary" />
						Ready to run
					</p>
				</div>

				<p className="px-5 py-8 font-mono text-[clamp(17px,2.1vw,30px)] leading-[1.9] text-pretty">
					<span className="text-accent">&gt;</span>{" "}
					<Slot id="asset" value={values.asset} onChange={update} /> yielding{" "}
					<Slot id="yield" value={values.yield} onChange={update} />, minimum{" "}
					<Slot id="minimum" value={values.minimum} onChange={update} />,{" "}
					<Slot id="region" value={values.region} onChange={update} /> exposure,{" "}
					<Slot id="risk" value={values.risk} onChange={update} /> risk.
				</p>

				<div className="flex flex-col gap-4 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
					{/* Sans, not the mono eyebrow. This is the one line that has to be
					    read rather than scanned, so it should not be set in the least
					    readable style on the page. */}
					<p className="max-w-md text-sm text-pretty text-muted">
						Every highlighted value is a menu. Nothing is submitted until you
						run it.
					</p>

					<TrackedLink
						href={`/dashboard?mandate=${encodeURIComponent(mandate)}`}
						event="cta_click"
						eventParams={{ location: "composer" }}
						className={`${actionClass("solid")} w-full sm:w-auto sm:min-w-64`}
					>
						Run this mandate
						<Arrow />
					</TrackedLink>
				</div>
			</div>
		</section>
	);
}
