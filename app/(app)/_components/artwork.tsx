/*
 * Venue artwork, shown rather than linked.
 *
 * A plain <img> on purpose. next/image would route these through the server's
 * optimiser, which means this server fetching whatever URL a source row names
 * — and source rows are configuration. Letting the browser load the image
 * directly keeps that request where it belongs. No referrer goes with it, and
 * a URL that no longer resolves simply leaves the space empty.
 */
export function Artwork({
	src,
	alt,
	size = 24,
}: {
	src: string;
	alt: string;
	size?: number;
}) {
	return (
		/* eslint-disable-next-line @next/next/no-img-element -- see above */
		<img
			src={src}
			alt={alt}
			width={size}
			height={size}
			loading="lazy"
			referrerPolicy="no-referrer"
			className="inline-block shrink-0 object-contain"
			style={{ width: size, height: size }}
		/>
	);
}
