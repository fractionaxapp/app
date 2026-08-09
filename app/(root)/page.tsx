import Link from "next/link";

const features = [
	{
		title: "Two surfaces",
		description:
			"A marketing site and a product dashboard, routed from one app directory.",
	},
	{
		title: "One token scale",
		description:
			"Both surfaces read from the same colour and type tokens, so brand stays consistent.",
	},
	{
		title: "Separate chrome",
		description:
			"Each route group brings its own navigation, density and page frame.",
	},
];

export default function HomePage() {
	return (
		<>
			<section className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
				<h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
					The marketing surface, served from the (root) group.
				</h1>
				<p className="mt-6 max-w-xl text-lg text-muted">
					Everything under (root) shares this header and footer. The product
					lives under (app) with its own chrome, on the same design tokens.
				</p>

				<div className="mt-10 flex flex-col gap-3 sm:flex-row">
					<Link
						href="/dashboard"
						className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
					>
						Open the dashboard
					</Link>
					<Link
						href="/#features"
						className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-surface-muted"
					>
						Learn more
					</Link>
				</div>
			</section>

			<section
				id="features"
				className="mx-auto w-full max-w-5xl px-6 pb-24 sm:pb-32"
			>
				<div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
					{features.map((feature) => (
						<article key={feature.title} className="bg-surface p-8">
							<h2 className="text-base font-medium">{feature.title}</h2>
							<p className="mt-2 text-sm text-muted">{feature.description}</p>
						</article>
					))}
				</div>
			</section>
		</>
	);
}
