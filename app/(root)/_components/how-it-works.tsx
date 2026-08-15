import { MandateConsole } from "./mandate-console";
import { SectionHeading } from "./ui";

export function HowItWorks() {
	return (
		<section id="workflow" className="fx-section fx-bleed scroll-mt-14">
			<SectionHeading
				eyebrow="How it works"
				title="One mandate. Five stages. No handoffs"
				copy="Discovery, underwriting, eligibility, execution and monitoring run as one continuous job — not five tools and a spreadsheet. You stay in the loop where it matters, at approval."
			/>

			<div className="mt-[clamp(48px,6vw,96px)]">
				<MandateConsole />
			</div>
		</section>
	);
}
