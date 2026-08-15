/*
 * The mark is a fraction glyph: a solid numerator, a rule, a hollow
 * denominator. Square-cornered, like everything else on this surface, and
 * drawn rather than imported so it inherits currentColor.
 */
export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<rect x="2" y="2" width="8" height="8" fill="currentColor" />
			<path d="M5 19 19 5" stroke="currentColor" strokeWidth="2" />
			<rect
				x="14"
				y="14"
				width="8"
				height="8"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</svg>
	);
}

export function Wordmark({ className }: { className?: string }) {
	return (
		<span className={`flex items-center gap-2.5 ${className ?? ""}`}>
			<LogoMark className="size-5 text-accent" />
			<span className="text-[15px] font-extrabold tracking-[-0.04em] uppercase">
				Fractionax
			</span>
		</span>
	);
}
