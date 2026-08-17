import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
	title: "Privacy",
	description:
		"What Fractionax collects, why, who processes it, and how to have it removed.",
	alternates: { canonical: "/privacy" },
};

/*
 * Written against the actual data model — db/migrations/0001_users.sql, the
 * Privy session cookies read in lib/wallet/server.ts, and the GA4 tag in
 * app/_components/analytics.tsx. If those change, this page is wrong until it
 * changes with them.
 */
export default function PrivacyPage() {
	return (
		<LegalPage
			title="Privacy"
			summary="What we collect, why we collect it, and how to have it removed. This describes what the software actually does, field by field."
			updated="17 August 2026"
			current="/privacy"
		>
			<h2>What we collect</h2>

			<p>
				Three things, and nothing else: who you are, which wallets you hold, and
				when you signed in.
			</p>

			<h3>Account identity</h3>
			<p>
				When you sign in, our authentication provider passes us a stable
				identifier for your account and whichever contact details you used. We
				store that identifier, and any of the following that apply: your email
				address, your phone number, and the provider and subject ID of a linked
				social account.
			</p>

			<h3>Wallets</h3>
			<p>
				One record per wallet you hold or connect: the public address, which
				chain it is on, which client it came from, and whether it was created
				for you or connected by you. Public addresses only. We never hold your
				private keys, and we cannot move funds on your behalf outside a mandate
				you have approved.
			</p>

			<h3>Sign-in history</h3>
			<p>
				Each sign-in appends a record: the method used, your IP address, your
				browser&rsquo;s user-agent string, and the time. This exists for
				security review, for support, and to count genuinely active accounts.
				It is append-only, so it is a history rather than a current state.
			</p>

			<h3>Analytics</h3>
			<p>
				If analytics are enabled for a deployment, Google Analytics 4 records
				page views and a small number of named events — following a call to
				action, submitting a mandate. These describe usage of the site, not the
				contents of your account.
			</p>

			<h2>What we do not collect</h2>

			<ul>
				<li>Private keys, seed phrases or wallet credentials of any kind.</li>
				<li>
					Payment card details. If and when payments are introduced, they will
					be handled by a payment processor and this page will say so.
				</li>
				<li>
					Anything typed into the illustrative examples on the marketing site.
					The mandate composer and the shortlist panel run entirely in your
					browser and send nothing until you act on them.
				</li>
			</ul>

			<h2>Why we hold it</h2>

			<ul>
				<li>
					<strong>To run the service.</strong> Identity and wallets are what an
					account is; without them there is nothing to sign in to.
				</li>
				<li>
					<strong>To keep it secure.</strong> Sign-in history is how account
					takeover gets noticed and investigated.
				</li>
				<li>
					<strong>To support you.</strong> When something goes wrong, this is
					what lets us see what happened.
				</li>
				<li>
					<strong>To understand usage.</strong> Aggregate counts of active
					accounts, and which parts of the site people use.
				</li>
			</ul>

			<h2>Who else processes it</h2>

			<ul>
				<li>
					<strong>Privy</strong> authenticates you and provides embedded
					wallets. They hold your credentials; we hold a mirror of the
					resulting identity.
				</li>
				<li>
					<strong>Google Analytics</strong> receives page views and events when
					analytics are enabled, subject to Google&rsquo;s own terms.
				</li>
				<li>
					<strong>Our infrastructure provider</strong> hosts the application and
					the database.
				</li>
			</ul>

			<p>
				We do not sell your data, and we do not share it with advertisers.
			</p>

			<h2>Cookies</h2>

			<p>
				Signing in sets session cookies belonging to our authentication
				provider: a short-lived access token, an identity token, and a refresh
				token. They are what keeps you signed in, and clearing them signs you
				out. Where analytics are enabled, Google sets its own cookies to
				distinguish sessions.
			</p>

			<h2>How long we keep it</h2>

			<p>
				Account and wallet records last for the life of the account. Sign-in
				history is retained while the account exists, as it is what makes a
				security review possible after the fact. Deleting an account removes the
				account record and, with it, every wallet record and every sign-in event
				attached to it.
			</p>

			<h2>Your choices</h2>

			<ul>
				<li>
					<strong>See what we hold.</strong> Ask, and we will tell you what is
					stored against your account.
				</li>
				<li>
					<strong>Correct it.</strong> Contact details come from your
					authentication provider; changing them there updates them here on
					your next sign-in.
				</li>
				<li>
					<strong>Delete it.</strong> Ask us to close your account and the
					records described above are removed.
				</li>
				<li>
					<strong>Opt out of analytics.</strong> Browser-level do-not-track and
					tracking-blocking extensions both work; we do not attempt to defeat
					them.
				</li>
			</ul>

			<p>
				Depending on where you live, you may have further rights over your data.
				We will honour those where they apply.
			</p>

			<h2>Contact</h2>

			<p>
				Write to{" "}
				<a href="mailto:privacy@fractionax.app">privacy@fractionax.app</a> for
				anything on this page, including access and deletion requests.
			</p>
		</LegalPage>
	);
}
