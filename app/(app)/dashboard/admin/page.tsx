import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdmin } from "@/lib/admin";
import { countByStatus, listAccounts, listRecentChanges } from "@/lib/db/admin";
import { isDatabaseEnabled } from "@/lib/db/client";
import type { AccessStatus } from "@/lib/db/users";

import { Panel } from "../../_components/panel";

import { setAccess } from "./actions";

/*
 * Gated here as well as in the body. Metadata resolves first, so a visitor who
 * is not an administrator gets "Page not found" as the document title rather
 * than the name of a screen they cannot open.
 *
 * The response still carries a 200 rather than a 404: by the time either check
 * runs, the shell has been flushed and the status is settled. The path is not
 * a secret anyway — it is in the client bundle, because the topbar has to be
 * able to name it. What matters is that no account data is rendered, which is
 * what both checks guarantee.
 */
export async function generateMetadata(): Promise<Metadata> {
	if (!(await getAdmin())) notFound();

	return { title: "Access", robots: { index: false, follow: false } };
}

const LIMIT = 200;

const filters = [
	{ key: "waitlisted", label: "Waiting" },
	{ key: "approved", label: "Admitted" },
	{ key: "declined", label: "Declined" },
	{ key: "all", label: "Everyone" },
] as const;

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

/*
 * How long someone has been waiting is the number this screen is actually
 * about, and a date makes you compute it yourself. The exact timestamp stays
 * available on hover.
 */
function ago(value: Date | null) {
	if (!value) return "never";

	const days = Math.floor((Date.now() - value.getTime()) / 86_400_000);

	if (days < 1) return "today";
	if (days === 1) return "1 day";
	if (days < 60) return `${days} days`;

	const months = Math.floor(days / 30);
	return months < 24 ? `${months} months` : `${Math.floor(days / 365)} years`;
}

/** "today" and "never" are already whole phrases; the rest need the suffix. */
function since(value: Date | null, verb: string) {
	if (!value) return `never ${verb}`;

	const span = ago(value);
	return span === "today" ? `${verb} today` : `${verb} ${span} ago`;
}

function shorten(did: string) {
	return did.length > 26 ? `${did.slice(0, 16)}…${did.slice(-6)}` : did;
}

/*
 * The eyebrow style uppercases, which is right for labels and wrong for
 * anything a person might copy: a DID is case-sensitive and an email read back
 * in capitals is an email you cannot trust you read correctly.
 */
const meta = "font-mono text-xs tracking-wide text-muted";

const statusTone: Record<AccessStatus, string> = {
	approved: "text-primary",
	waitlisted: "text-accent",
	declined: "text-muted",
};

const statusLabel: Record<AccessStatus, string> = {
	approved: "Admitted",
	waitlisted: "Waiting",
	declined: "Declined",
};

/** One button, one transition. Teal admits; everything else is a step back. */
function Action({
	userId,
	to,
	children,
	tone = "muted",
}: {
	userId: string;
	to: AccessStatus;
	children: string;
	tone?: "admit" | "muted" | "danger";
}) {
	const tones = {
		admit:
			"border-primary/50 text-primary hover:border-primary hover:bg-primary hover:text-background",
		muted:
			"border-border text-muted hover:border-foreground hover:text-foreground",
		danger: "border-border text-muted hover:border-danger hover:text-danger",
	};

	return (
		<form action={setAccess}>
			<input type="hidden" name="userId" value={userId} />
			<input type="hidden" name="status" value={to} />
			<button
				type="submit"
				className={`fx-eyebrow inline-flex min-h-9 cursor-pointer items-center border px-3.5 font-semibold transition-colors ${tones[tone]}`}
			>
				{children}
			</button>
		</form>
	);
}

/*
 * The access queue.
 *
 * Not linked from anywhere a non-administrator can see, and it renders nothing
 * for one: the check below runs before any query, so an unauthorised request
 * gets the not-found page and not a single row.
 *
 * Being an administrator is independent of being admitted, which is what makes
 * the first admission possible at all — otherwise the only person who could
 * admit anyone would be someone already admitted.
 */
export default async function AdminPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string; q?: string }>;
}) {
	const admin = await getAdmin();
	if (!admin) notFound();

	if (!isDatabaseEnabled) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Panel title="Access">
					<p className="px-5 py-6 text-pretty text-muted">
						DATABASE_URL is not set, so there is no queue to read. Accounts
						cannot be admitted until the app can reach Postgres.
					</p>
				</Panel>
			</div>
		);
	}

	const params = await searchParams;
	const search = typeof params.q === "string" ? params.q.slice(0, 200) : "";

	const active =
		filters.find((filter) => filter.key === params.status)?.key ?? "waitlisted";

	const [counts, accounts, changes] = await Promise.all([
		countByStatus(),
		listAccounts({
			status: active === "all" ? null : active,
			search,
			limit: LIMIT,
		}),
		listRecentChanges(),
	]);

	const metrics = [
		{ label: "Waiting", value: counts.waitlisted, tone: "text-accent" },
		{ label: "Admitted", value: counts.approved, tone: "text-primary" },
		{ label: "Declined", value: counts.declined, tone: "text-muted" },
	];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<section className="grid gap-px border border-border bg-border sm:grid-cols-3">
				{metrics.map((metric) => (
					<article key={metric.label} className="bg-surface px-5 py-6">
						<p className="fx-eyebrow text-muted">{metric.label}</p>
						<p
							className={`mt-3 font-mono text-3xl leading-none font-medium tracking-tight tabular-nums ${metric.tone}`}
						>
							{metric.value}
						</p>
					</article>
				))}
			</section>

			<Panel
				title="Access queue"
				status={
					<span className="text-muted">
						{accounts.length}
						{accounts.length === LIMIT ? `+ shown` : " shown"}
					</span>
				}
			>
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-3.5">
					<nav className="flex flex-wrap gap-px bg-border">
						{filters.map((filter) => (
							<Link
								key={filter.key}
								href={`/dashboard/admin?status=${filter.key}${
									search ? `&q=${encodeURIComponent(search)}` : ""
								}`}
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

					{/* GET, so a filtered queue is a URL you can keep. */}
					<form className="flex items-center gap-px bg-border">
						<input type="hidden" name="status" value={active} />
						<input
							type="search"
							name="q"
							defaultValue={search}
							placeholder="Email or account ID"
							aria-label="Search accounts"
							className="min-h-9 w-56 bg-surface px-3 font-mono text-sm outline-none placeholder:text-muted/60 focus:bg-surface-muted"
						/>
						<button
							type="submit"
							className="fx-eyebrow min-h-9 cursor-pointer bg-surface px-3.5 text-muted transition-colors hover:text-foreground"
						>
							Find
						</button>
					</form>
				</div>

				{accounts.length === 0 ? (
					<p className="px-5 py-8 text-pretty text-muted">
						{search
							? "No account matches that."
							: active === "waitlisted"
								? "Nobody is waiting."
								: "Nothing here yet."}
					</p>
				) : (
					<ul className="min-w-0">
						{accounts.map((account) => {
							const isSelf = account.privy_did === admin.did;

							return (
								<li
									key={account.id}
									className="grid gap-x-8 gap-y-4 border-b border-border px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_14rem] lg:items-center"
								>
									<div className="min-w-0">
										<p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
											<span
												className={`font-mono text-sm break-all ${
													account.email ? "" : "text-muted"
												}`}
											>
												{account.email ?? "no email on record"}
											</span>
											{isSelf ? (
												<span className="fx-eyebrow text-muted">You</span>
											) : null}
										</p>

										<p className={`mt-1.5 ${meta}`} title={account.privy_did}>
											{shorten(account.privy_did)}
											{account.oauth_provider
												? ` · ${account.oauth_provider}`
												: ""}
											{account.wallet_count > 0
												? ` · ${account.wallet_count} wallet${
														account.wallet_count === 1 ? "" : "s"
													}`
												: ""}
										</p>
									</div>

									<div className="min-w-0">
										<p
											className={`fx-eyebrow ${statusTone[account.access_status]}`}
										>
											{statusLabel[account.access_status]}
											{account.access_status === "waitlisted"
												? ` · ${ago(account.created_at)}`
												: ""}
										</p>

										<p className="fx-eyebrow mt-1.5 text-muted">
											{/* For a waiting account the join date is the wait,
											    already stated above; repeating it says nothing. */}
											{account.access_status !== "waitlisted" ? (
												<>
													<span title={stamp.format(account.created_at)}>
														{since(account.created_at, "joined")}
													</span>
													{" · "}
												</>
											) : null}
											<span
												title={
													account.last_login_at
														? stamp.format(account.last_login_at)
														: undefined
												}
											>
												{account.last_login_at
													? since(account.last_login_at, "seen")
													: "never signed in"}
											</span>
										</p>

										{account.decided_by && account.decided_at ? (
											<p
												className={`mt-1.5 ${meta} opacity-70`}
												title={stamp.format(account.decided_at)}
											>
												by {account.decided_by}
											</p>
										) : null}
									</div>

									<div className="flex flex-wrap gap-2 lg:justify-end">
										{account.access_status !== "approved" ? (
											<Action userId={account.id} to="approved" tone="admit">
												Admit
											</Action>
										) : null}

										{account.access_status === "approved" ? (
											<Action userId={account.id} to="waitlisted" tone="danger">
												Revoke
											</Action>
										) : null}

										{account.access_status === "waitlisted" ? (
											<Action userId={account.id} to="declined" tone="danger">
												Decline
											</Action>
										) : null}

										{account.access_status === "declined" ? (
											<Action userId={account.id} to="waitlisted" tone="muted">
												Back to waiting
											</Action>
										) : null}
									</div>
								</li>
							);
						})}
					</ul>
				)}

				{accounts.length === LIMIT ? (
					<p className="border-t border-border px-5 py-4 text-sm text-muted">
						Showing the first {LIMIT}. Narrow it with the search box rather than
						scrolling.
					</p>
				) : null}
			</Panel>

			<Panel
				title="Recent decisions"
				status={<span className="text-muted">Last {changes.length}</span>}
			>
				{changes.length === 0 ? (
					<p className="px-5 py-6 text-muted">
						No access has been changed from this screen yet.
					</p>
				) : (
					<ul>
						{changes.map((change) => (
							<li
								key={`${change.privy_did}:${change.changed_at.toISOString()}`}
								className="grid gap-x-8 gap-y-1 border-b border-border px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-baseline"
							>
								<span className="font-mono text-sm break-all">
									{change.email ?? shorten(change.privy_did)}
								</span>

								<span className="fx-eyebrow text-muted">
									{statusLabel[change.from_status]} →{" "}
									<span className={statusTone[change.to_status]}>
										{statusLabel[change.to_status]}
									</span>
								</span>

								<span className={meta}>
									{change.actor_email ?? shorten(change.actor_did)} ·{" "}
									{stamp.format(change.changed_at)}
								</span>
							</li>
						))}
					</ul>
				)}

				<p className="border-t border-border px-5 py-4 text-sm text-pretty text-muted">
					Every change is recorded against the account with the administrator
					who made it. Revoking sets an account back to waiting; the dashboard
					reads this on every request, so it takes effect on their next page
					load.
				</p>
			</Panel>
		</div>
	);
}
