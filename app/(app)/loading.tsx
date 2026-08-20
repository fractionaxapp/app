import { StillLoading } from "./_components/stalled";

/*
 * Dashboard skeleton, shaped like the cells it replaces.
 *
 * With a deadline on it. These pages read a database on another continent, so
 * a few seconds here is ordinary and gets no commentary — but a wait that goes
 * on past any reasonable render has stopped being a wait, and saying so is the
 * difference between a page a person can act on and one they stare at.
 */
export default function Loading() {
	return (
		<>
			<div className="mx-auto flex w-full max-w-5xl animate-pulse flex-col gap-px bg-border">
				<div className="grid gap-px sm:grid-cols-3">
					{[0, 1, 2].map((index) => (
						<div key={index} className="h-28 bg-surface" />
					))}
				</div>
				<div className="h-40 bg-surface" />
			</div>

			<StillLoading />
		</>
	);
}
