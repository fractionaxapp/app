import Link from "next/link";

const navigation = [
	{ href: "/#features", label: "Features" },
	{ href: "/#pricing", label: "Pricing" },
	{ href: "/#docs", label: "Docs" },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
				<Link href="/" className="text-base font-semibold tracking-tight">
					App
				</Link>

				<nav className="hidden items-center gap-8 sm:flex">
					{navigation.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="text-sm text-muted transition-colors hover:text-foreground"
						>
							{item.label}
						</Link>
					))}
				</nav>

				<Link
					href="/dashboard"
					className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
				>
					Dashboard
				</Link>
			</div>
		</header>
	);
}
