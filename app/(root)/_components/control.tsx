import { SectionHeading } from "./ui";

/*
 * The answer to the question the headline provokes. "The agent decides" is
 * only reassuring if the edges are stated plainly, so this section is two
 * lists and no argument.
 */

const autonomous = [
	"Scans every new offering across 167 issuance platforms, continuously",
	"Underwrites each match on yield, coverage, term, seniority and jurisdiction",
	"Clears your eligibility with the issuer before a deal reaches your shortlist",
	"Tracks distributions, covenants and secondary marks on everything you hold",
	"Re-runs the whole search the moment you change the mandate",
];

const bounded = [
	"Allocate more than the size limit you set",
	"Buy outside the asset classes, regions or risk band in your mandate",
	"Settle at a venue or with a counterparty you have not approved",
	"Change the mandate itself",
	"Skip your approval — unless you hand that over deliberately",
];

export function Control() {
	return (
		<section id="control" className="fx-section fx-bleed scroll-mt-14 bg-surface">
			<SectionHeading
				eyebrow="Control"
				title="What the agent does. What it never does"
				copy="Autonomy is bounded by a mandate you write and can rewrite at any time. These are the edges, stated plainly."
			/>

			<div className="mt-[clamp(48px,6vw,96px)] grid gap-px bg-border lg:grid-cols-2">
				<div className="bg-surface p-6 sm:p-8">
					<h3 className="text-[clamp(20px,2vw,30px)] leading-tight font-extrabold tracking-[-0.04em] uppercase">
						Runs on its own
					</h3>

					<ul className="mt-7 flex flex-col gap-4">
						{autonomous.map((item) => (
							<li key={item} className="flex gap-4 text-pretty">
								{/* Filled: the agent acts. */}
								<span className="mt-2.5 size-1.5 shrink-0 bg-primary" />
								{item}
							</li>
						))}
					</ul>
				</div>

				<div className="bg-surface p-6 sm:p-8">
					<h3 className="text-[clamp(20px,2vw,30px)] leading-tight font-extrabold tracking-[-0.04em] uppercase">
						Never without you
					</h3>

					<ul className="mt-7 flex flex-col gap-4">
						{bounded.map((item) => (
							<li key={item} className="flex gap-4 text-pretty text-muted">
								{/* Hollow: the agent is stopped. Not danger red — being
								    prevented is the system working, not a failure. */}
								<span className="mt-2.5 size-1.5 shrink-0 border border-muted" />
								{item}
							</li>
						))}
					</ul>
				</div>
			</div>

			<p className="mt-[clamp(32px,4vw,56px)] max-w-3xl text-[clamp(18px,1.8vw,26px)] leading-[1.3] text-pretty">
				Hand over per-deal approval whenever you want.{" "}
				<span className="text-muted">The limits stay either way.</span>
			</p>
		</section>
	);
}
