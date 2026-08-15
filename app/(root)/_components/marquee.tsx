/*
 * The asset classes the agents cover, as a continuous ticker.
 *
 * Hollow and moving by default. Hovering stops the track and fills the word
 * under the pointer; leaving it starts the track again and the word empties.
 * All CSS — there is no state here worth a client component.
 *
 * The sequence is rendered twice so translating by -50% lands exactly on the
 * seam. The second copy is hidden from assistive tech, which would otherwise
 * read the whole list through twice.
 */

const classes = [
	"Private credit",
	"Commercial real estate",
	"Trade finance",
	"Infrastructure",
	"Treasuries",
	"Receivables",
	"Private equity",
	"Royalties",
];

/** Shared so the separators sit on the same baseline as the words. */
const TYPE =
	"text-[clamp(30px,4.4vw,72px)] leading-none font-extrabold tracking-[-0.045em] whitespace-nowrap uppercase";

function Sequence({ hidden }: { hidden?: boolean }) {
	return (
		<div className="flex items-center" aria-hidden={hidden}>
			{classes.map((label) => (
				<span key={label} className="flex items-center">
					{/* The separator is a sibling, not a child — nesting it would
					    give it the word's outline and its fill on hover. */}
					<span className={`fx-outline ${TYPE}`}>{label}</span>
					<span className={`mx-6 text-accent sm:mx-9 ${TYPE}`} aria-hidden>
						/
					</span>
				</span>
			))}
		</div>
	);
}

export function Marquee() {
	return (
		<section className="overflow-hidden border-b border-border py-[clamp(36px,4.5vw,72px)]">
			<h2 className="sr-only">Asset classes covered</h2>

			<div className="fx-marquee flex w-max">
				<Sequence />
				<Sequence hidden />
			</div>
		</section>
	);
}
