/*
 * The four stage pages, defined once. The header nav, the footer, the sitemap
 * and the chain from one page to the next all read from here, so adding or
 * reordering a stage is a single edit.
 *
 * Note the workflow console on the home page still runs five steps — Qualify
 * sits between Underwrite and Execute there. That is deliberate for now: the
 * console shows the mechanism, these pages carry the four-word story used in
 * the hero and the footer.
 */

export type Stage = {
	slug: string;
	verb: string;
	/** Sentence-case label for nav and prose. */
	label: string;
	title: string;
	summary: string;
	/** The manual job this replaces, stated before the claim. */
	chore: string;
	points: { title: string; body: string }[];
	figures: { value: string; label: string }[];
	/** True when the figures are constructed for illustration. */
	illustrative: boolean;
};

export const stages: Stage[] = [
	{
		slug: "discover",
		verb: "Discover",
		label: "Discover",
		title: "Every tokenized offering, in one index",
		summary:
			"Private markets have no shared index. Offerings sit on the venue that issued them, described the way that venue happens to describe them. The agent reads all of it, continuously, and puts it in one place.",
		chore: "Check 167 venues one at a time, and hope you did not miss the one that mattered",
		points: [
			{
				title: "Crawled continuously, not on request",
				body: "Issuance platforms are polled on a schedule, so a new offering is in the index before you think to look for it. You are not searching a cache of whatever was available the last time someone ran a report.",
			},
			{
				title: "Normalised into one schema",
				body: "Every venue names things differently. Term, coupon, seniority, minimum, jurisdiction — all mapped to the same fields, which is the only reason two offerings from two issuers can be put side by side at all.",
			},
			{
				title: "Filtered by your mandate, not by a menu",
				body: "You describe what you want in a sentence. The index is queried against that, rather than you clicking through categories that were designed by whoever built the venue.",
			},
		],
		figures: [
			{ value: "167", label: "Issuance platforms under coverage" },
			{ value: "1,284", label: "Offerings indexed" },
			{ value: "37", label: "Matching an example mandate" },
		],
		illustrative: true,
	},
	{
		slug: "underwrite",
		verb: "Underwrite",
		label: "Underwrite",
		title: "Every deal read the same way",
		summary:
			"A deal arrives as a PDF. Comparing two of them means rebuilding both by hand, which is why most allocators only ever look closely at the large ones. The agent reads every deal to the same depth, whatever the cheque.",
		chore: "Rebuild every offering memo into your own spreadsheet before you can compare anything",
		points: [
			{
				title: "Documents parsed into fields",
				body: "Offering memos, term sheets and payment histories are read into one comparable field set. Thirty-seven PDFs become thirty-seven rows you can sort.",
			},
			{
				title: "The same model on every deal",
				body: "No offering gets a lighter read because it is small. A $25,000 allocation is underwritten the way a $25M one is, which is the whole reason a small allocation is worth making at all.",
			},
			{
				title: "Flags, not just scores",
				body: "Where something in a document contradicts the summary, or a covenant is unusual, it is surfaced as a flag against the deal rather than averaged away into a number.",
			},
		],
		figures: [
			{ value: "8.4%", label: "Median net yield, example run" },
			{ value: "1.62×", label: "Median DSCR" },
			{ value: "3", label: "Flags raised" },
		],
		illustrative: true,
	},
	{
		slug: "execute",
		verb: "Execute",
		label: "Execute",
		title: "You approve. The agent settles",
		summary:
			"The agent brings a shortlist and waits. Settlement runs inside limits you set and cannot step outside — and if you would rather not be asked each time, that is a switch you control.",
		chore: "Police your own size and counterparty limits on every single trade",
		points: [
			{
				title: "Approval is the default",
				body: "Nothing settles until you say so. The shortlist is a decision put in front of you, not a notification that something already happened.",
			},
			{
				title: "Limits bind either way",
				body: "Size, venue, counterparty and asset class are attached to the mandate. The agent cannot exceed them, and cannot change the mandate that sets them.",
			},
			{
				title: "Delegation is yours to give and take back",
				body: "A mandate can be switched to run unattended, in which case anything fitting it settles without waking you. The limits still apply, the trades are still yours, and the switch reverses at any time.",
			},
		],
		figures: [
			{ value: "$25,000", label: "Minimum allocation" },
			{ value: "4", label: "Policy limits on every mandate" },
			{ value: "Your call", label: "Approve each trade, or let it run" },
		],
		illustrative: false,
	},
	{
		slug: "monitor",
		verb: "Monitor",
		label: "Monitor",
		title: "The position keeps being watched",
		summary:
			"Most of what goes wrong in private markets goes wrong slowly, and is found late. The agent that underwrote a position keeps reading it after the trade.",
		chore: "Track distributions in a spreadsheet and find out about a missed covenant months later",
		points: [
			{
				title: "Distributions tracked, not reconciled",
				body: "Coupons and repayments are followed against what the offering promised, so a late or short payment is a thing you are told about rather than something you notice at quarter end.",
			},
			{
				title: "Covenants tested continuously",
				body: "The conditions in the document are checked against what the issuer reports, on the schedule the document sets.",
			},
			{
				title: "Read by the model that underwrote it",
				body: "Monitoring uses the same parsed fields the underwriting used, so a change is measured against the thing you actually bought.",
			},
		],
		/*
		 * These have to agree with the ledger and the drift table above them.
		 * The page argues that a position is worth watching closely, and closing
		 * it on a next-coupon date and a passing covenant test read as
		 * reassurance — the opposite of what the sections above just showed.
		 */
		figures: [
			{ value: "84%", label: "Of underwritten coverage remaining" },
			{ value: "7%", label: "Of covenant headroom remaining" },
			{ value: "0", label: "Covenants breached" },
		],
		illustrative: true,
	},
];

export const stageBySlug = (slug: string) =>
	stages.find((stage) => stage.slug === slug);

export const nextStage = (slug: string) => {
	const index = stages.findIndex((stage) => stage.slug === slug);
	return index === -1 ? undefined : stages[index + 1];
};
