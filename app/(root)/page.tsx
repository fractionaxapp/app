import { Control } from "./_components/control";
import { Faq } from "./_components/faq";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { MandateComposer } from "./_components/mandate-composer";
import { Marquee } from "./_components/marquee";
import { Platform } from "./_components/platform";

/*
 * Ordered by the questions a visitor actually asks, in the order they ask
 * them: what is this, what can I put money into, how does it work, how much
 * of my judgement am I giving up, what does it handle for me, what else do I
 * need to know — then a mandate to act on.
 *
 * Deliberately not ordered as an argument. Why-now, problem-statement, origin
 * and vision sections are how you pitch a company, not how you explain a
 * product to someone deciding whether to sign up.
 */
export default function HomePage() {
	return (
		<>
			<Hero />
			<Marquee />
			<HowItWorks />
			<Control />
			<Platform />
			<Faq />
			<MandateComposer />
		</>
	);
}
