/*
 * The asset classes the agents cover, as a continuous ticker. Two tracks
 * running against each other: one solid, one hollow. The list is rendered
 * twice per track so translating by -50% lands exactly on the seam.
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

function Track({
	reverse,
	hollow,
}: {
	reverse?: boolean;
	hollow?: boolean;
}) {
	return (
		<div
			aria-hidden={reverse}
			className={`fx-marquee flex w-max items-center ${
				reverse ? "[animation-direction:reverse]" : ""
			}`}
		>
			{[...classes, ...classes].map((label, index) => (
				<span
					key={`${label}-${index}`}
					className={`flex items-center text-[clamp(28px,4.2vw,68px)] leading-none font-extrabold tracking-[-0.045em] whitespace-nowrap uppercase ${
						hollow ? "fx-outline" : ""
					}`}
				>
					{label}
					<span className="mx-6 text-accent sm:mx-9" aria-hidden>
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
			<Track />
			<div className="mt-[clamp(8px,1vw,18px)]">
				<Track reverse hollow />
			</div>
		</section>
	);
}
