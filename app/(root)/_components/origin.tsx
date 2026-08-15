import { SectionHeading } from "./ui";

const beats = [
	{
		label: "What we assumed",
		body: "That getting assets on-chain was the bottleneck, and a good marketplace would clear it.",
	},
	{
		label: "What we found",
		body: "Tokenization was not the hard part. Access without intelligence creates more friction, not less — more venues to check, more documents to read, more forms proving the same facts to a different counterparty.",
	},
	{
		label: "What we built instead",
		body: "The decision layer. The bigger opportunity was never supply. It was the decision.",
	},
];

export function Origin() {
	return (
		<section className="fx-section fx-bleed">
			<SectionHeading
				eyebrow="Origin"
				title="We built the marketplace first"
				copy="That is how we found the real problem — by shipping the obvious answer and watching where it failed."
			/>

			{/* Held to the middle column so the beats sit under the statement,
			    on the same rhythm as the section header above. */}
			<ol className="mt-[clamp(48px,6vw,96px)] grid lg:grid-cols-[1fr_2fr_1fr]">
				{beats.map((beat, index) => (
					<li
						key={beat.label}
						className="border-t border-border py-7 lg:col-start-2"
					>
						<p className="fx-eyebrow flex items-baseline gap-3 text-muted">
							<span className="text-accent tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>
							{beat.label}
						</p>
						<p className="mt-4 text-[clamp(17px,1.5vw,24px)] leading-[1.4] text-pretty">
							{beat.body}
						</p>
					</li>
				))}
			</ol>
		</section>
	);
}
