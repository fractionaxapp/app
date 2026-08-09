import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

/*
 * Web / marketing chrome: full-bleed header over a centred editorial column,
 * closed by a footer. Scoped to the .ds-web design system.
 */
export default function WebLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="ds-web flex min-h-full flex-1 flex-col bg-background text-foreground">
			<SiteHeader />
			<main className="flex-1">{children}</main>
			<SiteFooter />
		</div>
	);
}
