import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { findProfileByPrivyDid } from "@/lib/db/users";

import { NotSet, Panel, Row } from "../../_components/panel";

export const metadata: Metadata = { title: "Profile" };

/*
 * One month format across the page. A short month in the sign-in list beside a
 * long one in the panel above it reads as two different kinds of date when they
 * are the same kind.
 */
const date = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

const stamp = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

/** A wallet address is unreadable in full and unusable truncated to nothing. */
function shorten(address: string) {
	return address.length > 18
		? `${address.slice(0, 10)}…${address.slice(-8)}`
		: address;
}

/*
 * Everything here is read from the verified session and our own mirror of it —
 * never from anything the browser supplied. The page shows exactly the fields
 * the privacy page says we hold, which is deliberate: the two should not be
 * able to disagree.
 */
export default async function ProfilePage() {
	const access = await getAccess();

	if (access.state === "signed-out") return null;
	// Unapproved accounts get the queue screen, not a profile.
	if (access.state === "waiting") redirect("/dashboard");

	const profile = await findProfileByPrivyDid(access.did);

	if (!profile) {
		return (
			<div className="mx-auto w-full max-w-4xl">
				<Panel title="Profile">
					<p className="px-5 py-6 text-pretty text-muted">
						We could not read your account record. Signing out and back in
						usually rebuilds it; if it persists, write to{" "}
						<a
							href="mailto:hello@fractionax.app"
							className="text-primary underline underline-offset-4"
						>
							hello@fractionax.app
						</a>
						.
					</p>
				</Panel>
			</div>
		);
	}

	const { user, wallets, logins } = profile;

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			<Panel
				title="Identity"
				status={
					<span className="flex items-center gap-2.5 text-primary">
						<span aria-hidden className="size-1.5 bg-primary" />
						Admitted
					</span>
				}
			>
				<dl>
					<Row label="Email" value={user.email ?? <NotSet />} />
					<Row label="Phone" value={user.phone ?? <NotSet />} />
					<Row
						label="Social account"
						value={
							user.oauth_provider ? (
								<span className="capitalize">{user.oauth_provider}</span>
							) : (
								<NotSet>Not linked</NotSet>
							)
						}
					/>
					<Row
						label="Account ID"
						value={user.privy_did}
						hint="Stable for the life of the account. Quote it in support requests."
					/>
				</dl>
			</Panel>

			<Panel
				title="Wallets"
				status={
					<span className="text-muted">
						{wallets.length === 0
							? "None yet"
							: `${wallets.length} ${wallets.length === 1 ? "wallet" : "wallets"}`}
					</span>
				}
			>
				{wallets.length === 0 ? (
					<p className="px-5 py-6 text-pretty text-muted">
						No wallet is attached to this account yet. One is created the first
						time you need it — not on sign-up, so an account that never
						transacts never holds one.
					</p>
				) : (
					<ul>
						{wallets.map((wallet) => (
							<li
								key={`${wallet.chain_type}:${wallet.address}`}
								className="grid gap-x-8 gap-y-2 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-baseline"
							>
								<span
									className="font-mono text-sm break-all"
									title={wallet.address}
								>
									{shorten(wallet.address)}
								</span>

								<span className="fx-eyebrow text-muted">
									{wallet.chain_type}
									{wallet.wallet_client_type
										? ` · ${wallet.wallet_client_type}`
										: ""}
								</span>

								<span
									className={`fx-eyebrow ${
										wallet.is_embedded ? "text-primary" : "text-muted"
									}`}
								>
									{wallet.is_embedded ? "Held for you" : "Connected by you"}
								</span>
							</li>
						))}
					</ul>
				)}
			</Panel>

			<Panel title="Account">
				<dl>
					<Row label="Joined" value={date.format(user.created_at)} />
					<Row
						label="Admitted"
						value={
							user.approved_at ? (
								date.format(user.approved_at)
							) : (
								<NotSet>—</NotSet>
							)
						}
					/>
					<Row
						label="Last sign-in"
						value={
							user.last_login_at ? (
								stamp.format(user.last_login_at)
							) : (
								<NotSet>—</NotSet>
							)
						}
					/>
				</dl>
			</Panel>

			<Panel
				title="Recent sign-ins"
				status={<span className="text-muted">Last 5</span>}
			>
				{logins.length === 0 ? (
					<p className="px-5 py-6 text-muted">Nothing recorded yet.</p>
				) : (
					<ul>
						{logins.map((login, index) => (
							<li
								key={`${login.occurred_at.toISOString()}:${index}`}
								className="grid gap-x-8 gap-y-1 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] sm:items-baseline"
							>
								<span className="font-mono text-sm tabular-nums">
									{stamp.format(login.occurred_at)}
								</span>
								<span className="fx-eyebrow text-muted">
									{login.method ?? "unknown"}
								</span>
								<span className="fx-eyebrow text-muted">
									{login.ip ?? "no address recorded"}
								</span>
							</li>
						))}
					</ul>
				)}

				<p className="border-t border-border px-5 py-4 text-sm text-pretty text-muted">
					If you do not recognise one of these, change how you sign in and write
					to{" "}
					<a
						href="mailto:hello@fractionax.app"
						className="text-primary underline underline-offset-4"
					>
						hello@fractionax.app
					</a>
					.
				</p>
			</Panel>
		</div>
	);
}
