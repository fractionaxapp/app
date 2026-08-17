/* Dashboard skeleton, shaped like the cells it replaces. */
export default function Loading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl animate-pulse flex-col gap-px bg-border">
			<div className="grid gap-px sm:grid-cols-3">
				{[0, 1, 2].map((index) => (
					<div key={index} className="h-28 bg-surface" />
				))}
			</div>
			<div className="h-40 bg-surface" />
		</div>
	);
}
