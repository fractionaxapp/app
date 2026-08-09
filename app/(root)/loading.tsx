/* Streams instantly while a marketing route resolves, keeping header/footer. */
export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-5xl animate-pulse px-6 py-24 sm:py-32">
			<div className="h-12 w-full max-w-2xl rounded-lg bg-surface-muted" />
			<div className="mt-4 h-12 w-2/3 max-w-xl rounded-lg bg-surface-muted" />
			<div className="mt-8 h-6 w-full max-w-md rounded bg-surface-muted" />
			<div className="mt-10 flex gap-3">
				<div className="h-11 w-44 rounded-full bg-surface-muted" />
				<div className="h-11 w-32 rounded-full bg-surface-muted" />
			</div>
		</div>
	);
}
