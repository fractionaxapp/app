import Link from "next/link";

const links = [
	{ href: "/#privacy", label: "Privacy" },
	{ href: "/#terms", label: "Terms" },
	{ href: "/#contact", label: "Contact" },
];

export function SiteFooter() {
	return (
		<footer className="border-t border-border">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
				<p>© {new Date().getFullYear()} App. All rights reserved.</p>

				<nav className="flex gap-6">
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="transition-colors hover:text-foreground"
						>
							{link.label}
						</Link>
					))}
				</nav>
			</div>
		</footer>
	);
}
