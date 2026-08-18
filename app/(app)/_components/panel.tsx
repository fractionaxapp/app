/*
 * The product surface's equivalent of the marketing SectionBar: a titled panel
 * with an optional right-hand status, and rows of label/value inside it.
 *
 * Same vocabulary as the rest of the site — square edges, hairline divisions,
 * mono labels — so the dashboard does not read as a different product.
 */

export function Panel({
	title,
	status,
	children,
}: {
	title: string;
	status?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="border border-border bg-surface">
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
				<h2 className="fx-eyebrow text-muted">{title}</h2>
				{status ? <div className="fx-eyebrow">{status}</div> : null}
			</div>

			{children}
		</section>
	);
}

/**
 * One label/value row. `mono` for anything a machine produced — addresses,
 * identifiers, timestamps — so they line up and stay scannable.
 */
export function Row({
	label,
	value,
	hint,
	mono = true,
}: {
	label: string;
	value: React.ReactNode;
	hint?: string;
	mono?: boolean;
}) {
	return (
		<div className="grid gap-x-8 gap-y-1 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
			<dt>
				<span className="fx-eyebrow text-muted">{label}</span>
				{hint ? (
					<span className="mt-1 block text-xs text-muted/70">{hint}</span>
				) : null}
			</dt>

			<dd
				className={
					mono
						? "font-mono text-sm break-all tabular-nums"
						: "text-sm text-pretty"
				}
			>
				{value}
			</dd>
		</div>
	);
}

/** Shown where a value exists but is not set, rather than an empty cell. */
export function NotSet({ children = "Not set" }: { children?: string }) {
	return <span className="text-muted">{children}</span>;
}
