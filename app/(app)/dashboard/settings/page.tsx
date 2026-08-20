import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAccess } from "@/lib/access";
import { findProfileByPrivyDid } from "@/lib/db/users";

import { NotSet, Panel, Row } from "../../_components/panel";
import { SignOutButton } from "../../_components/sign-out-button";
import { SessionExpired } from "../../_components/session-expired";

export const metadata: Metadata = { title: "Settings" };

/*
 * Only settings that do something are settings.
 *
 * There are no switches on this page for notification preferences or mandate
 * defaults, because neither is wired to anything that would remember them. A
 * control that silently forgets is worse than a sentence saying the feature is
 * not built, and on a page about an account it is a small breach of trust.
 * Each of those sections says what happens today instead.
 */
export default async function SettingsPage() {
	const access = await getAccess();

	// The browser thinks it is signed in and this server disagrees; say so
	// rather than rendering an empty page inside working chrome.
	if (access.state === "signed-out") return <SessionExpired />;
	if (access.state === "waiting") redirect("/dashboard");

	const profile = await findProfileByPrivyDid(access.did);
	const user = profile?.user;

	const methods = [
		user?.email ? "Email" : null,
		user?.phone ? "Phone" : null,
		user?.oauth_provider
			? user.oauth_provider.charAt(0).toUpperCase() +
				user.oauth_provider.slice(1)
			: null,
		profile?.wallets.some((wallet) => !wallet.is_embedded) ? "Wallet" : null,
	].filter(Boolean) as string[];

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			<Panel title="How you sign in">
				<dl>
					<Row
						label="Methods"
						value={methods.length > 0 ? methods.join(", ") : <NotSet />}
						hint="Whichever you used, plus anything you have linked since."
					/>
					<Row
						label="Managed by"
						value="Your authentication provider"
						mono={false}
						hint="We hold a mirror of the resulting identity, never your credentials."
					/>
				</dl>

				<p className="border-t border-border px-5 py-4 text-sm text-pretty text-muted">
					Adding or removing a sign-in method happens during sign-in, not here.
					Changing your email with the provider updates it on this account at
					your next sign-in.
				</p>
			</Panel>

			<Panel
				title="Notifications"
				status={<span className="text-muted">Not configurable yet</span>}
			>
				<p className="px-5 py-6 text-pretty text-muted">
					There is nothing to switch here yet, so there are no switches. Today
					we email you about one thing only: your account and its access. No
					marketing, no digests, and nothing you have to opt out of.
				</p>

				<p className="border-t border-border px-5 py-4 text-sm text-pretty text-muted">
					When mandates start running, this is where you will choose what you
					are told about and how often.
				</p>
			</Panel>

			<Panel title="Your data">
				<dl>
					<Row
						label="What we hold"
						value="Identity, wallet addresses, sign-in history"
						mono={false}
						hint="Set out field by field on the privacy page."
					/>
				</dl>

				<div className="flex flex-col gap-4 border-t border-border px-5 py-5">
					<p className="text-sm text-pretty text-muted">
						Ask for a copy of what is stored against this account, or ask us to
						delete it. Deleting the account removes the account record and, with
						it, every wallet record and sign-in event attached to it.
					</p>

					<div className="flex flex-wrap gap-3">
						<a
							href="mailto:privacy@fractionax.app?subject=Data%20export%20request"
							className="fx-eyebrow inline-flex min-h-11 items-center border border-border px-5 font-semibold transition-colors hover:border-foreground"
						>
							Request a copy
						</a>

						<a
							href="mailto:privacy@fractionax.app?subject=Account%20deletion%20request"
							className="fx-eyebrow inline-flex min-h-11 items-center border border-border px-5 font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
						>
							Request deletion
						</a>

						<a
							href="/privacy"
							className="fx-eyebrow inline-flex min-h-11 items-center px-2 font-semibold text-primary underline underline-offset-4"
						>
							Privacy page
						</a>
					</div>
				</div>
			</Panel>

			<Panel title="Session">
				<div className="flex flex-col gap-4 px-5 py-5">
					<p className="text-sm text-pretty text-muted">
						Signs you out on this device. Any wallet you connected stays yours —
						signing out does not disconnect or move it.
					</p>

					<div>
						<SignOutButton />
					</div>
				</div>
			</Panel>
		</div>
	);
}
