import Link from "next/link";

/*
 * Shared frame for the three legal pages. Same band-and-gutter language as the
 * rest of the site, with the meta column held sticky beside the prose.
 *
 * The draft notice is a deliberate, visible part of the layout rather than a
 * code comment. These documents were drafted from how the software actually
 * behaves, not by a lawyer, and publishing them as settled policy is the one
 * failure mode that would matter — a financial platform is held to what its
 * terms say. Remove the `draft` prop once each page has been reviewed.
 */

const pages = [
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
	{ href: "/disclosures", label: "Disclosures" },
];

export function LegalPage({
	title,
	summary,
	updated,
	current,
	draft = true,
	children,
}: {
	title: string;
	summary: string;
	updated: string;
	current: string;
	draft?: boolean;
	children: React.ReactNode;
}) {
	return (
		<article className="fx-bleed py-[clamp(48px,6vw,96px)]">
			<div className="grid gap-x-8 gap-y-10 lg:grid-cols-[1fr_2fr_1fr]">
				<p className="fx-eyebrow text-muted">Legal</p>

				<div>
					<h1 className="fx-heading">{title}</h1>
					<p className="mt-6 max-w-2xl text-pretty text-muted">{summary}</p>
				</div>
			</div>

			<div className="mt-[clamp(40px,5vw,72px)] grid gap-x-8 gap-y-10 border-t border-border pt-10 lg:grid-cols-[1fr_2fr_1fr]">
				{/* Meta rail: where you are, and when this last changed. */}
				<div className="flex flex-col gap-8 lg:sticky lg:top-20 lg:self-start">
					<div>
						<p className="fx-eyebrow text-muted">Last updated</p>
						<p className="mt-2.5 font-mono text-sm tabular-nums">{updated}</p>
					</div>

					<nav aria-label="Legal documents">
						<p className="fx-eyebrow text-muted">Documents</p>
						<ul className="mt-3 flex flex-col">
							{pages.map((page) => {
								const isCurrent = page.href === current;

								return (
									<li key={page.href}>
										<Link
											href={page.href}
											aria-current={isCurrent ? "page" : undefined}
											className={`fx-eyebrow flex items-center gap-2.5 py-2 transition-colors ${
												isCurrent
													? "text-foreground"
													: "text-muted hover:text-foreground"
											}`}
										>
											<span
												aria-hidden
												className={`size-1 shrink-0 ${
													isCurrent ? "bg-primary" : "bg-transparent"
												}`}
											/>
											{page.label}
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>
				</div>

				<div>
					{draft ? (
						<p className="mb-10 flex gap-3 border border-accent/40 bg-accent/[0.06] px-5 py-4 text-sm text-pretty">
							<span aria-hidden className="mt-0.5 text-accent">
								!
							</span>
							<span className="text-muted">
								<strong className="font-semibold text-foreground">
									Draft, pending legal review.
								</strong>{" "}
								This document describes how the software currently behaves. It
								has not been reviewed by counsel and is not yet a binding
								agreement. Do not rely on it.
							</span>
						</p>
					) : null}

					<div className="fx-prose">{children}</div>
				</div>
			</div>
		</article>
	);
}
