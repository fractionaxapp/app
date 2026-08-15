/*
 * Shared marketing chrome. Square edges, mono labels, hairline rules — the
 * vocabulary every section is assembled from.
 */

export function Arrow({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden="true"
			className={className ?? "size-3.5 shrink-0"}
		>
			<path
				d="M3 13 13 3M6 3h7v7"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="square"
			/>
		</svg>
	);
}

/**
 * Class string for the page's one button shape: a square slab with the label
 * pushed left and the arrow pushed right. Returned rather than wrapped in a
 * component so callers can still reach for TrackedLink, Link or button.
 */
export function actionClass(variant: "solid" | "ghost" = "solid") {
	const base =
		"fx-eyebrow inline-flex min-h-13 items-center justify-between gap-7 px-5 font-semibold transition-colors";

	return variant === "solid"
		? `${base} border border-accent bg-accent text-accent-foreground hover:bg-transparent hover:text-accent`
		: `${base} border border-border text-foreground hover:border-foreground`;
}

/**
 * The section header used across the page: label, statement and supporting
 * copy on one baseline. Three columns on desktop, stacked below — the middle
 * column is twice the width of either edge, so the statement dominates.
 */
export function SectionHeading({
	eyebrow,
	title,
	copy,
	action,
}: {
	eyebrow: string;
	title: React.ReactNode;
	copy?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="grid items-start gap-8 lg:grid-cols-[1fr_2fr_1fr] lg:gap-8">
			<p className="fx-eyebrow text-muted">{eyebrow}</p>

			<h2 className="fx-heading">{title}</h2>

			{copy || action ? (
				<div className="max-w-115">
					{copy ? (
						<p className="text-pretty text-muted lg:mt-2">{copy}</p>
					) : null}
					{action ? <div className="mt-8 lg:text-right">{action}</div> : null}
				</div>
			) : null}
		</div>
	);
}
