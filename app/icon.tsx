import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/* Favicon, generated at build time so it always matches the site name. */
export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: siteConfig.colors.dark,
				color: siteConfig.colors.light,
				fontSize: 22,
				fontWeight: 600,
				borderRadius: 6,
			}}
		>
			{siteConfig.name.charAt(0)}
		</div>,
		size,
	);
}
