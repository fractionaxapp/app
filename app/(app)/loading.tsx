/* Dashboard skeleton, shaped like the metric cards it replaces. */
export default function Loading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl animate-pulse flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-3">
				{[0, 1, 2].map((index) => (
					<div
						key={index}
						className="h-28 rounded-lg border border-border bg-surface"
					/>
				))}
			</div>
			<div className="h-40 rounded-lg border border-border bg-surface" />
		</div>
	);
}
