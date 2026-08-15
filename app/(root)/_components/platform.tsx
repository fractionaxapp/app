import { SectionHeading } from "./ui";

const surfaces = [
	{
		endpoint: "/tokenization",
		title: "Tokenization",
		body: "Issue, wrap and reference tokenized instruments across chains and issuance venues.",
	},
	{
		endpoint: "/identity",
		title: "Identity",
		body: "One verified investor identity, reusable at every issuer that will accept it.",
	},
	{
		endpoint: "/compliance",
		title: "Compliance",
		body: "Jurisdiction, accreditation and transfer restrictions resolved per asset, before execution.",
	},
	{
		endpoint: "/assets",
		title: "Asset data",
		body: "Offering documents, payment histories and secondary marks, normalised into one schema.",
	},
	{
		endpoint: "/execution",
		title: "Execution",
		body: "Policy-bounded settlement on-chain, with the approval gates you define.",
	},
	{
		endpoint: "/portfolio",
		title: "Portfolio",
		body: "Positions, distributions and covenants tracked continuously after the trade.",
	},
];

export function Platform() {
	return (
		<section
			id="platform"
			className="fx-section fx-bleed scroll-mt-14 bg-surface"
		>
			<SectionHeading
				eyebrow="Platform"
				title="One intelligence layer across the lifecycle"
				copy="The agents run on infrastructure you can call directly. Same primitives, whether a person or a model is holding the mandate."
			/>

			<div className="mt-[clamp(48px,6vw,96px)] grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
				{surfaces.map((surface) => (
					<article
						key={surface.endpoint}
						className="bg-surface p-6 transition-colors hover:bg-surface-muted sm:p-8"
					>
						<p className="fx-eyebrow text-accent">{surface.endpoint}</p>
						<h3 className="mt-5 text-lg leading-tight font-extrabold tracking-[-0.03em] uppercase">
							{surface.title}
						</h3>
						<p className="mt-3 text-sm text-pretty text-muted">{surface.body}</p>
					</article>
				))}
			</div>
		</section>
	);
}
