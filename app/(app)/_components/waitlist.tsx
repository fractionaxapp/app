import Link from "next/link";

import type { Access } from "@/lib/access";

/*
 * What a signed-in but unapproved account sees instead of the product.
 *
 * It states the position honestly, including when we do not know it. A queue
 * screen that invents a number to feel encouraging is worse than one that says
 * it is still working the position out, because the number is checkable the
 * moment anyone compares two accounts.
 */

const dateFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border px-5 py-4">
			<dt className="fx-eyebrow text-muted">{label}</dt>
			<dd className="font-mono text-sm tabular-nums">{value}</dd>
		</div>
	);
}

export function Waitlist({
	access,
}: {
	access: Extract<Access, { state: "waiting" }>;
}) {
	const declined = access.status === "declined";

	return (
		<div className="mx-auto w-full max-w-3xl">
			<div className="border border-border bg-surface">
				<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-3.5">
					<p className="fx-eyebrow text-muted">Account</p>

					<p
						className={`fx-eyebrow flex items-center gap-2.5 ${
							declined ? "text-muted" : "text-accent"
						}`}
					>
						<span
							aria-hidden
							className={`size-1.5 ${declined ? "bg-muted" : "bg-accent"}`}
						/>
						{declined ? "Not admitted" : "On the waitlist"}
					</p>
				</div>

				<div className="px-5 py-8">
					<h2 className="text-[clamp(22px,2.6vw,34px)] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance uppercase">
						{declined
							? "This account has not been admitted"
							: "You're on the list"}
					</h2>

					<p className="mt-4 max-w-xl text-pretty text-muted">
						{declined ? (
							<>
								We are not able to offer access to this account for the private
								beta. If you think that is a mistake, write to{" "}
								<a
									href="mailto:hello@fractionax.app"
									className="text-primary underline underline-offset-4"
								>
									hello@fractionax.app
								</a>{" "}
								and we will take another look.
							</>
						) : (
							<>
								Your account is created and your place is held. Access to the
								private beta is granted by hand, in the order accounts join —
								we review each one, and email you when yours is open.
							</>
						)}
					</p>
				</div>

				{!declined ? (
					<dl>
						{access.email ? <Row label="Account" value={access.email} /> : null}

						<Row
							label="Joined"
							value={
								access.joinedAt ? dateFormat.format(access.joinedAt) : "Just now"
							}
						/>

						<Row
							label="Ahead of you"
							value={
								access.unknown || access.ahead === null
									? "Confirming"
									: access.ahead === 0
										? "Nobody — you're next"
										: access.ahead.toLocaleString("en-GB")
							}
						/>
					</dl>
				) : null}
			</div>

			{/*
			 * Only for accounts actually in the queue. Telling someone who has been
			 * turned down that their mandate "moves things along" is untrue, and
			 * inviting them to send one wastes their time; they are pointed at a
			 * reply in the panel above instead.
			 */}
			{declined ? null : (
				<div className="mt-6 border border-border bg-surface px-5 py-6">
					<p className="fx-eyebrow text-muted">While you wait</p>

					<p className="mt-3 max-w-xl text-pretty text-muted">
						Telling us what you are looking to allocate moves things along — it
						is the first thing we ask when a place opens.
					</p>

					<div className="mt-5 flex flex-wrap gap-3">
						<a
							href="mailto:hello@fractionax.app?subject=My%20mandate"
							className="fx-eyebrow inline-flex min-h-11 items-center gap-4 border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary"
						>
							Tell us your mandate
						</a>

						<Link
							href="/#workflow"
							className="fx-eyebrow inline-flex min-h-11 items-center gap-4 border border-border px-5 font-semibold transition-colors hover:border-foreground"
						>
							See how it works
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
