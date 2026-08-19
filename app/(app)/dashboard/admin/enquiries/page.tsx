import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdmin } from "@/lib/admin";
import { isDatabaseEnabled } from "@/lib/db/client";
import {
	countNewEnquiries,
	listEnquiries,
	type EnquiryStatus,
} from "@/lib/db/enquiries";
import { isEmailConfigured } from "@/lib/email";

import { Panel } from "../../../_components/panel";

import { setEnquiry } from "./actions";

/* Gated in metadata as well as in the body — see the access queue for why. */
export async function generateMetadata(): Promise<Metadata> {
	if (!(await getAdmin())) notFound();

	return { title: "Enquiries", robots: { index: false, follow: false } };
}

const LIMIT = 100;

const filters = [
	{ key: "new", label: "New" },
	{ key: "handled", label: "Handled" },
	{ key: "all", label: "Everything" },
] as const;

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

/* Uppercase is for labels; an address someone has to read back is not one. */
const meta = "font-mono text-xs tracking-wide text-muted";

/*
 * Questions asked from the landing page.
 *
 * The list is the record; the notification email is a convenience on top of
 * it. That is why a message whose notification failed is flagged here rather
 * than being silently identical to one that went out — this screen is the
 * place where "nobody was told" has to be visible.
 */
export default async function EnquiriesPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const admin = await getAdmin();
	if (!admin) notFound();

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Enquiries">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so nothing is being recorded. The contact
						form tells visitors to write in by email until it is.
					</p>
				</Panel>
			</div>
		);
	}

	// Only meaningful when mail is set up: with no provider configured nothing
	// was ever going to send, and flagging every row for it says nothing the
	// banner above has not already said.
	const mailConfigured = isEmailConfigured();

	const params = await searchParams;
	const active = filters.find((f) => f.key === params.status)?.key ?? "new";

	const [enquiries, waiting] = await Promise.all([
		listEnquiries({
			status: active === "all" ? null : (active as EnquiryStatus),
			limit: LIMIT,
		}),
		countNewEnquiries(),
	]);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			{!isEmailConfigured() ? (
				<p className="border border-border bg-surface px-5 py-4 text-sm text-pretty text-muted">
					Notification email is not configured, so nothing is sent when a
					question arrives — this screen is the only place they appear. Set
					RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL to change
					that.
				</p>
			) : null}

			<Panel
				title="Enquiries"
				status={
					<span className={waiting > 0 ? "text-accent" : "text-muted"}>
						{waiting} unanswered
					</span>
				}
			>
				<div className="flex flex-wrap items-center gap-px border-b border-border bg-border px-5 py-3.5">
					<nav className="flex flex-wrap gap-px bg-border">
						{filters.map((filter) => (
							<Link
								key={filter.key}
								href={`/dashboard/admin/enquiries?status=${filter.key}`}
								aria-current={filter.key === active ? "page" : undefined}
								className={`fx-eyebrow px-3.5 py-2 transition-colors ${
									filter.key === active
										? "bg-surface-muted text-foreground"
										: "bg-surface text-muted hover:text-foreground"
								}`}
							>
								{filter.label}
							</Link>
						))}
					</nav>
				</div>

				{enquiries.length === 0 ? (
					<p className="px-5 py-8 text-pretty text-muted">
						{active === "new" ? "Nothing unanswered." : "Nothing here yet."}
					</p>
				) : (
					<ul className="min-w-0">
						{enquiries.map((enquiry) => (
							<li
								key={enquiry.id}
								className="border-b border-border px-5 py-5 last:border-b-0"
							>
								<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
									<div className="min-w-0">
										<p className="font-mono text-sm break-all">
											{enquiry.name}
											<span className="text-muted"> · </span>
											<a
												href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
													"Re: your question about Fractionax",
												)}`}
												className="text-primary underline underline-offset-4"
											>
												{enquiry.email}
											</a>
										</p>

										<p className={`mt-1.5 ${meta}`}>
											{stamp.format(enquiry.created_at)}
											{enquiry.ip ? ` · ${enquiry.ip}` : ""}
											{enquiry.status === "handled" && enquiry.handled_at
												? ` · handled ${stamp.format(enquiry.handled_at)}`
												: ""}
										</p>
									</div>

									<div className="flex flex-wrap items-center gap-3">
										{mailConfigured &&
										enquiry.status === "new" &&
										!enquiry.notified ? (
											<span
												className="fx-eyebrow text-danger"
												title="The notification email did not go out. The message itself is safe."
											>
												Not emailed
											</span>
										) : null}

										<form action={setEnquiry}>
											<input type="hidden" name="id" value={enquiry.id} />
											<input
												type="hidden"
												name="status"
												value={enquiry.status === "new" ? "handled" : "new"}
											/>
											<button
												type="submit"
												className={`fx-eyebrow inline-flex min-h-9 cursor-pointer items-center border px-3.5 font-semibold transition-colors ${
													enquiry.status === "new"
														? "border-primary/50 text-primary hover:border-primary hover:bg-primary hover:text-background"
														: "border-border text-muted hover:border-foreground hover:text-foreground"
												}`}
											>
												{enquiry.status === "new" ? "Mark handled" : "Reopen"}
											</button>
										</form>
									</div>
								</div>

								{/* Their words, wrapped as written — never trimmed to a
								    preview, because the whole question is the point. */}
								<p className="mt-4 border-l-2 border-border pl-4 text-sm whitespace-pre-wrap text-pretty">
									{enquiry.message}
								</p>
							</li>
						))}
					</ul>
				)}

				{enquiries.length === LIMIT ? (
					<p className="border-t border-border px-5 py-4 text-sm text-muted">
						Showing the most recent {LIMIT}.
					</p>
				) : null}
			</Panel>
		</div>
	);
}
