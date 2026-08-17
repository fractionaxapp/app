import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
	title: "Terms",
	description:
		"The terms on which Fractionax is offered during the private beta.",
	alternates: { canonical: "/terms" },
};

/*
 * The clauses describing agent authority are accurate to the product — mandate
 * limits, approval modes, and the fact that approval can be delegated. The
 * commercial and jurisdictional clauses are placeholders and are marked as
 * such in the page itself rather than quietly invented.
 */
export default function TermsPage() {
	return (
		<LegalPage
			title="Terms of use"
			summary="The basis on which Fractionax is offered during the private beta, what the agent is authorised to do on your behalf, and where our responsibility ends."
			updated="17 August 2026"
			current="/terms"
		>
			<h2>Who may use Fractionax</h2>

			<p>
				Access is limited to accredited investors and professional allocators,
				in a cohort we admit individually. You must be old enough to enter a
				contract where you live, and you must not be barred from using a service
				like this under any law that applies to you. We may decline or withdraw
				access without giving a reason.
			</p>

			<h2>The service is in beta</h2>

			<p>
				Fractionax is early software offered on a limited basis. Features change
				and occasionally break; availability is not guaranteed, and neither is
				continuity of any particular feature. The deals shown on the marketing
				site are illustrative examples, not offers — see our{" "}
				<a href="/disclosures">disclosures</a>.
			</p>

			<h2>Your account</h2>

			<ul>
				<li>
					You are responsible for keeping access to your account secure,
					including the email, social account or wallet you sign in with.
				</li>
				<li>
					If you connect an external wallet, its keys remain yours alone. We
					cannot recover them and cannot act with them outside what you approve.
				</li>
				<li>
					Tell us promptly if you believe someone else has gained access to your
					account.
				</li>
			</ul>

			<h2>What the agent may do</h2>

			<p>
				A mandate is an instruction you write. It sets what the agent may look
				for and the limits it must stay inside — size, venue, counterparty and
				asset class among them. Within that mandate the agent searches,
				underwrites and prepares transactions.
			</p>

			<ul>
				<li>
					<strong>By default, nothing settles without you.</strong> The agent
					brings a shortlist and waits for your approval on each trade.
				</li>
				<li>
					<strong>You may delegate that approval.</strong> If you switch a
					mandate to run unattended, the agent may settle anything that fits it,
					without asking. The limits still bind. The consequences of trades made
					this way are yours, and this is reversible at any time.
				</li>
				<li>
					<strong>The agent cannot change its own mandate</strong>, exceed the
					limits you set, or transact outside them.
				</li>
			</ul>

			<h2>We do not give advice</h2>

			<p>
				Fractionax is software. Nothing it produces — a shortlist, an
				underwriting summary, a score, a projection — is investment, legal, tax
				or accounting advice, and none of it is a recommendation that you buy
				anything. Automated analysis can be wrong, incomplete, or based on
				information that is itself wrong. Decisions you make remain yours.
			</p>

			<h2>Third-party issuers and venues</h2>

			<p>
				Offerings surfaced by Fractionax are created, sold and administered by
				third parties. We do not issue them, underwrite them as principal, or
				guarantee their accuracy, performance or settlement. Your relationship
				with an issuer is governed by that issuer&rsquo;s own terms, which you
				should read.
			</p>

			<h2>Acceptable use</h2>

			<ul>
				<li>
					Do not attempt to gain access to accounts, data or systems that are
					not yours.
				</li>
				<li>
					Do not scrape, resell or redistribute the underwriting output as a
					data product.
				</li>
				<li>
					Do not use the service to launder money, evade sanctions, or in breach
					of any law that applies to you.
				</li>
			</ul>

			<h2>Ownership</h2>

			<p>
				The software, the interface and the underwriting models are ours. Your
				mandates and your data are yours; you grant us the permission needed to
				operate the service for you.
			</p>

			<h2>Liability</h2>

			<p>
				The service is provided as-is during the beta, without warranties of any
				kind. To the fullest extent the law allows, we are not liable for
				investment losses, for the acts of third-party issuers, or for
				indirect or consequential loss.
			</p>

			<p>
				<strong>
					The precise limits of liability, the governing law and the forum for
					disputes are still to be settled with counsel.
				</strong>{" "}
				They will be stated here in full before this document takes effect.
			</p>

			<h2>Ending access</h2>

			<p>
				You may stop using Fractionax at any time and ask us to close your
				account. We may suspend or end access where these terms are breached, or
				where we are required to. Positions you already hold with an issuer are
				unaffected by the closing of a Fractionax account; they exist between
				you and that issuer.
			</p>

			<h2>Changes</h2>

			<p>
				We will update these terms as the product changes. Material changes will
				be notified to account holders, and the date at the top of this page
				always reflects the current version.
			</p>

			<h2>Contact</h2>

			<p>
				Questions about these terms go to{" "}
				<a href="mailto:legal@fractionax.app">legal@fractionax.app</a>.
			</p>
		</LegalPage>
	);
}
