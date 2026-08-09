import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// Apple touch icons are 180x180 and must not be transparent.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
				fontSize: 110,
				fontWeight: 600,
			}}
		>
			{siteConfig.name.charAt(0)}
		</div>,
		size,
	);
}
