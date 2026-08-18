/*
 * The same position the other three pages describe: Receivables pool VII,
 * 9.2%, senior secured, underwritten at 1.80× against a covenant floor of
 * 1.50×. Following one deal across all four stages is worth more than four
 * unrelated examples, and it means the numbers here can be checked against the
 * excerpt on the Underwrite page.
 *
 * Nothing has breached. That is the point — the drift is visible while there
 * is still time to do something, which is the difference between monitoring
 * and reconciling.
 */

import { SectionBar } from "./ui";

type Event = {
	date: string;
	label: string;
	detail: string;
	value: string;
	state: "settled" | "ok" | "watch" | "due";
};

const events: Event[] = [
	{
		date: "12 Sep 2025",
		label: "Settled",
		detail: "$25,000 · 24-month term · senior secured",
		value: "1.80×",
		state: "settled",
	},
	{
		date: "31 Dec 2025",
		label: "Covenant test",
		detail: "DSCR reported and verified",
		value: "1.74×",
		state: "ok",
	},
	{
		date: "02 Jan 2026",
		label: "Coupon received",
		detail: "Quarterly, in arrears · on time",
		value: "$575",
		state: "ok",
	},
	{
		date: "31 Mar 2026",
		label: "Covenant test",
		detail: "DSCR reported and verified",
		value: "1.61×",
		state: "ok",
	},
	{
		date: "01 Apr 2026",
		label: "Coupon received",
		detail: "Quarterly, in arrears · on time",
		value: "$575",
		state: "ok",
	},
	{
		date: "30 Jun 2026",
		label: "Covenant test",
		detail: "Passing, but 0.02× above the 1.50× floor",
		value: "1.52×",
		state: "watch",
	},
	{
		date: "06 Jul 2026",
		label: "Coupon received",
		detail: "Due 3 July · arrived three days late",
		value: "$575",
		state: "watch",
	},
	{
		date: "01 Sep 2026",
		label: "Coupon due",
		detail: "Scheduled · not yet received",
		value: "$575",
		state: "due",
	},
];

const marks = {
	settled: "bg-primary",
	ok: "bg-primary",
	watch: "bg-accent",
	due: "border border-muted",
} as const;

export function MonitorLedger() {
	return (
		<section className="fx-section fx-bleed">
			<SectionBar
				label="One position, watched"
				copy="The deal underwritten on the previous page, eleven months in. Nothing has breached. Two things are worth looking at."
			/>

			<div className="mt-10 min-w-0">
				<div className="border border-border bg-surface">
					<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
						<p className="fx-eyebrow text-muted">
							Receivables pool VII · SG · trade finance
						</p>
						<p className="fx-eyebrow flex items-center gap-2.5 text-primary">
							<span aria-hidden className="size-1.5 bg-primary" />
							Held
						</p>
					</div>

					<ol className="px-5 py-2">
						{events.map((event) => (
							<li key={event.date} className="flex gap-4 py-3.5">
								{/* Spine, as in the Underneath section — one continuous
									    rule with each event sitting on it as a node. */}
								<div className="relative flex w-1.5 shrink-0 justify-center">
									<span
										aria-hidden
										className="absolute inset-y-[-0.875rem] w-px bg-border"
									/>
									<span
										aria-hidden
										className={`relative mt-1.5 size-1.5 shrink-0 ${marks[event.state]}`}
									/>
								</div>

								{/*
								 * Four ledger tracks — when, what, detail, value — rather
								 * than a left cluster with the value at the far edge. At
								 * full width the stacked version leaves the middle empty
								 * and the value stops reading as belonging to the row.
								 */}
								<div className="grid flex-1 gap-x-8 gap-y-1 lg:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.4fr)_6rem] lg:items-baseline">
									<span className="fx-eyebrow text-muted tabular-nums">
										{event.date}
									</span>

									<span
										className={`text-sm ${
											event.state === "watch"
												? "font-semibold text-accent"
												: event.state === "due"
													? "text-muted"
													: ""
										}`}
									>
										{event.label}
									</span>

									<span className="text-sm text-pretty text-muted">
										{event.detail}
									</span>

									<span
										className={`font-mono text-sm tabular-nums lg:text-right ${
											event.state === "watch"
												? "text-accent"
												: event.state === "due"
													? "text-muted"
													: ""
										}`}
									>
										{event.value}
									</span>
								</div>
							</li>
						))}
					</ol>

					<div className="flex gap-3 border-t border-border bg-accent/[0.06] px-5 py-4">
						<span aria-hidden className="mt-0.5 text-accent">
							!
						</span>
						<p className="text-sm text-pretty text-muted">
							<strong className="font-semibold text-foreground">
								Two flags, no breach.
							</strong>{" "}
							Coverage has fallen every quarter since settlement and now sits
							0.02× above the floor, and the last coupon arrived late. Either
							alone is unremarkable. Together they are worth a question to the
							issuer — which is a call you can still make, because it is August
							and not the maturity date.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
