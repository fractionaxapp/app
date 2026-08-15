import { Closing } from "./_components/closing";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { MandateComposer } from "./_components/mandate-composer";
import { Marquee } from "./_components/marquee";
import { Origin } from "./_components/origin";
import { Platform } from "./_components/platform";
import { Problem } from "./_components/problem";
import { Thesis } from "./_components/thesis";

/*
 * A stack of full-bleed bands, each closed by a hairline. The argument runs:
 * what this is, what it covers, why now, what is broken, how it works, what it
 * is built on, where it came from, what we think happens next — then a mandate
 * to act on. Alternating background and surface keeps the long scroll legible.
 */
export default function HomePage() {
	return (
		<>
			<Hero />
			<Marquee />
			<Thesis />
			<Problem />
			<HowItWorks />
			<Platform />
			<Origin />
			<Closing />
			<MandateComposer />
		</>
	);
}
