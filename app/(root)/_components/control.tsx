"use client";

import { useState } from "react";

import { SectionHeading } from "./ui";

/*
 * The answer to the question the headline provokes. "The agent decides" is
 * only reassuring if the edges are stated plainly — so this section is a
 * policy panel and two lists, not an argument.
 *
 * The approval toggle is the point. Claiming a boundary can be moved and then
 * not letting anyone move it is a weaker claim than showing the capability
 * cross from one column to the other. Turning approval off also surfaces its
 * consequence, because an autonomy control with no stated cost is a sales
 * pitch rather than a setting.
 */

const BOUNDS = ["Size", "Venue", "Counterparty", "Asset class"];

const AUTONOMOUS = [
	"Scans every new offering across 167 issuance platforms, continuously",
	"Underwrites each match on yield, coverage, term, seniority and jurisdiction",
	"Clears your eligibility with the issuer before a deal reaches your shortlist",
	"Tracks distributions, covenants and secondary marks on everything you hold",
	"Re-runs the whole search the moment you change the mandate",
];

const BOUNDED = [
	"Allocate more than the size limit you set",
	"Buy outside the asset classes, regions or risk band in your mandate",
	"Settle at a venue or with a counterparty you have not approved",
	"Change the mandate itself",
];

/** The one capability that crosses the boundary when approval is handed over. */
const APPROVAL_ITEM = "Settle a single trade — every one waits for you";
const UNATTENDED_ITEM = "Settles anything that fits the mandate, without waking you";

function Item({
	children,
	filled,
	moved,
}: {
	children: React.ReactNode;
	filled?: boolean;
	moved?: boolean;
}) {
	return (
		<li
			className={`flex gap-4 text-pretty ${moved ? "fx-reveal" : ""} ${
				filled ? "" : "text-muted"
			}`}
		>
			<span
				className={`mt-2.5 size-1.5 shrink-0 ${
					moved
						? "bg-accent"
						: filled
							? "bg-primary"
							: "border border-muted"
				}`}
			/>
			{children}
		</li>
	);
}

export function Control() {
	const [unattended, setUnattended] = useState(false);

	return (
		<section id="control" className="fx-section fx-bleed scroll-mt-14 bg-surface">
			<SectionHeading
				eyebrow="Control"
				title="What the agent does. What it never does"
				copy="Autonomy is bounded by a mandate you write and can rewrite at any time. Move the boundary below and watch what crosses it."
			/>

			<div className="mt-[clamp(48px,6vw,96px)] border border-border">
				<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">Mandate policy</p>

					<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
						<span className="size-1.5 bg-primary" />
						Active
					</p>
				</div>

				<div className="grid gap-px bg-border md:grid-cols-2">
					<div className="bg-surface px-5 py-5">
						<p className="fx-eyebrow text-muted">Approval</p>

						<div className="mt-3 inline-flex border border-border">
							{[
								{ label: "Approve every trade", value: false },
								{ label: "Run unattended", value: true },
							].map((option) => (
								<button
									key={option.label}
									type="button"
									onClick={() => setUnattended(option.value)}
									aria-pressed={unattended === option.value}
									className={`fx-eyebrow cursor-pointer px-3.5 py-2.5 font-semibold transition-colors ${
										unattended === option.value
											? "bg-primary text-primary-foreground"
											: "text-muted hover:text-foreground"
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					<div className="bg-surface px-5 py-5">
						<p className="fx-eyebrow text-muted">Bounded by</p>

						<ul className="mt-3 flex flex-wrap gap-2">
							{BOUNDS.map((bound) => (
								<li
									key={bound}
									className="fx-eyebrow flex items-center gap-2.5 border border-border px-3 py-2 text-foreground"
								>
									<span aria-hidden className="size-1 bg-accent" />
									{bound}
								</li>
							))}
						</ul>
					</div>
				</div>

				{/*
				 * Only shown when approval is off. An autonomy setting that never
				 * states its cost is not a setting, it is a boast.
				 */}
				{unattended ? (
					<p className="fx-reveal flex gap-3 border-t border-border bg-accent/[0.06] px-5 py-4 text-sm text-pretty">
						<span aria-hidden className="mt-0.5 text-accent">
							!
						</span>
						<span className="text-muted">
							An unattended mandate settles without a human check. The limits
							above still bind, but a deal inside them executes whether or not
							you would have chosen it yourself.
						</span>
					</p>
				) : null}

				<div className="grid gap-px border-t border-border bg-border lg:grid-cols-2">
					<div className="bg-surface p-6 sm:p-8">
						<h3 className="text-[clamp(19px,1.9vw,28px)] leading-tight font-extrabold tracking-[-0.04em] uppercase">
							Runs on its own
						</h3>

						<ul className="mt-7 flex flex-col gap-4">
							{AUTONOMOUS.map((item) => (
								<Item key={item} filled>
									{item}
								</Item>
							))}
							{unattended ? (
								<Item filled moved>
									{UNATTENDED_ITEM}
								</Item>
							) : null}
						</ul>
					</div>

					<div className="bg-surface p-6 sm:p-8">
						<h3 className="text-[clamp(19px,1.9vw,28px)] leading-tight font-extrabold tracking-[-0.04em] uppercase">
							Never without you
						</h3>

						<ul className="mt-7 flex flex-col gap-4">
							{BOUNDED.map((item) => (
								<Item key={item}>{item}</Item>
							))}
							{unattended ? null : (
								<Item moved>{APPROVAL_ITEM}</Item>
							)}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
