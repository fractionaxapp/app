import Link from "next/link";

import { Arrow, SectionHeading } from "./ui";

/*
 * The section a landing page has and a deck does not.
 *
 * Built on native <details>, so it is keyboard operable, announced correctly
 * and needs no client component. The shared `name` makes the group exclusive
 * — opening one closes the rest — which browsers without that support simply
 * ignore, leaving independent toggles.
 *
 * Every answer carries something to look at as well as read: a figure, or the
 * set of things it is talking about. Prose alone made this the flattest part
 * of the page, and the facts were already there to be shown.
 *
 * Questions we cannot answer honestly yet — fees, custody, regulated status,
 * jurisdictions, when the beta opens — are deliberately absent rather than
 * answered vaguely. A hedge on a page selling financial products costs more
 * trust than a gap.
 */

type Question = {
	q: string;
	a: string;
	/** Big mono numerals. Reserved for things that are genuinely quantities. */
	figures?: { value: string; label: string }[];
	/** The set the answer refers to. `flow` chains them with arrows instead. */
	tags?: { label: string; emphasis?: boolean }[];
	flow?: boolean;
};

const questions: Question[] = [
	{
		q: "Do I have to approve every deal?",
		a: "By default, yes — nothing settles until you say so. You can hand per-deal approval to the agent for a given mandate, and the size, venue and counterparty limits still apply. That is reversible at any time.",
		tags: [
			{ label: "Approve each deal", emphasis: true },
			{ label: "Or let it run unattended" },
		],
	},
	{
		q: "What if I reject everything on the shortlist?",
		a: "The agent widens the search and comes back with a new one. Rejections are signal: they change how it reads your mandate on the next run.",
		flow: true,
		tags: [
			{ label: "You reject" },
			{ label: "Mandate re-read" },
			{ label: "New shortlist" },
		],
	},
	{
		q: "Where do the deals come from?",
		a: "Issuance platforms crawled continuously and normalised into a single index, so you are not limited to whatever one venue happens to be selling.",
		figures: [
			{ value: "167", label: "Platforms covered" },
			{ value: "1", label: "Comparable index" },
		],
	},
	{
		q: "What can I actually invest in?",
		a: "Filtered to whatever your mandate allows — asset class, region, yield floor and risk band.",
		tags: [
			{ label: "Private credit" },
			{ label: "Commercial real estate" },
			{ label: "Trade finance" },
			{ label: "Infrastructure" },
			{ label: "Treasuries" },
			{ label: "Receivables" },
			{ label: "Private equity" },
			{ label: "Royalties" },
		],
	},
	{
		q: "What is the minimum?",
		a: "The point of the agent is that a small cheque gets the same underwriting as a large one, so the floor stays low.",
		figures: [{ value: "$25,000", label: "Per allocation" }],
	},
	{
		q: "Who can join the beta?",
		a: "A limited cohort. The deals are real, and so is the money.",
		tags: [
			{ label: "Accredited investors" },
			{ label: "Professional allocators" },
			{ label: "Limited cohort", emphasis: true },
		],
	},
];

/* One track definition, used by the summary and the answer so they align. */
const ROW =
	"grid grid-cols-[2.25rem_1fr_1.5rem] gap-x-4 sm:grid-cols-[4.5rem_1fr_2rem] sm:gap-x-6";

const QUESTION_TYPE =
	"text-[clamp(19px,2.3vw,38px)] leading-[1.08] font-extrabold tracking-[-0.045em] text-balance uppercase";

function Plus() {
	return (
		<svg
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden
			className="size-4 transition-transform duration-300 group-open:rotate-45"
		>
			<path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

function Aside({ item }: { item: Question }) {
	return (
		<>
			{item.figures ? (
				<dl className="mt-7 flex flex-wrap gap-x-12 gap-y-5">
					{item.figures.map((figure) => (
						<div key={figure.label}>
							<dt className="font-mono text-[clamp(26px,2.6vw,40px)] leading-none font-medium tracking-tight text-accent tabular-nums">
								{figure.value}
							</dt>
							<dd className="fx-eyebrow mt-2.5 text-muted">{figure.label}</dd>
						</div>
					))}
				</dl>
			) : null}

			{item.tags ? (
				<ul className="mt-7 flex flex-wrap items-center gap-2">
					{item.tags.map((tag, index) => (
						<li key={tag.label} className="flex items-center gap-2">
							{/* A chained answer reads as a loop, so the steps get arrows
							    between them rather than sitting as an unordered set. */}
							{item.flow && index > 0 ? (
								<span className="text-accent" aria-hidden>
									→
								</span>
							) : null}

							<span
								className={`fx-eyebrow flex items-center gap-2.5 border px-3 py-1.5 ${
									tag.emphasis
										? "border-primary text-primary"
										: "border-border text-foreground"
								}`}
							>
								{!tag.emphasis ? (
									<span className="size-1 shrink-0 bg-accent" aria-hidden />
								) : null}
								{tag.label}
							</span>
						</li>
					))}
				</ul>
			) : null}
		</>
	);
}

export function Faq() {
	return (
		<section id="faq" className="fx-section fx-bleed scroll-mt-14 bg-surface">
			<SectionHeading
				eyebrow="Questions"
				title="The things people ask first"
				copy="If yours is not here, it is the first thing we want to hear when you request access."
			/>

			<div className="mt-[clamp(48px,6vw,96px)] border-t border-border">
				{questions.map((item, index) => (
					<details
						key={item.q}
						name="faq"
						open={index === 0}
						className="group border-b border-border transition-colors open:bg-surface-muted"
					>
						<summary
							className={`${ROW} cursor-pointer list-none items-baseline py-6 [&::-webkit-details-marker]:hidden`}
						>
							<span className="fx-eyebrow text-accent tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>

							{/* Hollow until hovered or open — the same fill the marquee
							    and the workflow verbs use. */}
							<h3 className={`fx-outline ${QUESTION_TYPE}`}>{item.q}</h3>

							{/* Teal, not gold: this is a control, and controls are primary. */}
							<span className="justify-self-end text-primary">
								<Plus />
							</span>
						</summary>

						<div className={`${ROW} fx-reveal pb-8`}>
							<div className="col-start-2">
								<p className="max-w-2xl text-pretty text-muted">{item.a}</p>
								<Aside item={item} />
							</div>
						</div>
					</details>
				))}
			</div>

			{/* An exit to the CTA rather than a dead end at the last answer. */}
			<Link
				href="/#start"
				className={`${ROW} group items-baseline border-b border-border py-6 transition-colors hover:bg-surface-muted`}
			>
				<span className="fx-eyebrow text-muted tabular-nums">··</span>

				<span
					className={`${QUESTION_TYPE} text-muted transition-colors group-hover:text-foreground`}
				>
					Something else?
				</span>

				<span className="justify-self-end text-primary">
					<Arrow className="size-4" />
				</span>
			</Link>
		</section>
	);
}
