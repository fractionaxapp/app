import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.description;
// 1200x630 is the aspect ratio Open Graph and X both crop to.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * Default social share card. Any route segment can override it by adding its
 * own opengraph-image file. Twitter reuses this image unless a twitter-image
 * file is present.
 */
export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				background: siteConfig.colors.dark,
				color: siteConfig.colors.light,
				padding: 80,
			}}
		>
			<div style={{ display: "flex", fontSize: 32, opacity: 0.6 }}>
				{siteConfig.url.host}
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div style={{ display: "flex", fontSize: 84, fontWeight: 600 }}>
					{siteConfig.name}
				</div>
				<div
					style={{
						display: "flex",
						fontSize: 36,
						opacity: 0.7,
						maxWidth: 800,
						lineHeight: 1.4,
					}}
				>
					{siteConfig.description}
				</div>
			</div>
		</div>,
		size,
	);
}
