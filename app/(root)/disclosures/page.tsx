import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
	title: "Disclosures",
	description:
		"Investment risk, the limits of automated underwriting, and what the figures on this site are.",
	alternates: { canonical: "/disclosures" },
};

/*
 * The section on illustrative figures is not boilerplate. The marketing site
 * shows named deals with yields, DSCRs and settlement times that are invented
 * for demonstration; saying so plainly is the honest minimum, and the first
 * thing to revisit once real offerings are shown.
 */
export default function DisclosuresPage() {
	return (
		<LegalPage
			title="Disclosures"
			summary="What private-market investing risks, what the figures on this site actually are, and where automated underwriting stops being reliable."
			updated="17 August 2026"
			current="/disclosures"
		>
			<h2>Not an offer</h2>

			<p>
				Nothing on this site is an offer to sell, or a solicitation of an offer
				to buy, any security or investment product. Offerings are made by their
				issuers, under their own documents, to investors who are eligible for
				them. Availability depends on where you live and on your status as an
				investor.
			</p>

			<h2>The figures on this site are illustrative</h2>

			<p>
				The deal names, yields, coverage ratios, terms, allocation sizes and
				settlement times shown on the marketing pages are{" "}
				<strong>examples constructed for demonstration</strong>. They are not
				live offerings, not historical results, and not a representation that
				any particular return is available. The interactive panels are there to
				show how the product behaves, not what it has achieved.
			</p>

			<p>
				Market figures cited on this site — the size of the tokenized
				real-world asset market, the number of issuance platforms — come from
				third-party sources, are point-in-time, and may be out of date by the
				time you read them.
			</p>

			<h2>Private-market risk</h2>

			<ul>
				<li>
					<strong>You can lose everything.</strong> Private credit, real estate,
					trade finance and similar assets carry a risk of total loss of
					capital.
				</li>
				<li>
					<strong>They are illiquid.</strong> There may be no secondary market.
					Assume you cannot sell before maturity, and that any secondary price
					may be far below the last mark.
				</li>
				<li>
					<strong>Yields are targets, not promises.</strong> A stated yield is
					what an issuer expects to pay, not what it is obliged to pay. Payments
					can be reduced, delayed or missed.
				</li>
				<li>
					<strong>Valuations are estimates.</strong> Marks between issuance and
					maturity are modelled, not observed in a liquid market.
				</li>
				<li>
					<strong>Concentration compounds all of the above.</strong> A small
					number of positions in one asset class or one region is not a
					diversified portfolio.
				</li>
			</ul>

			<h2>Tokenized assets carry their own risks</h2>

			<ul>
				<li>
					Smart contracts can contain defects, and on-chain transactions are
					generally irreversible.
				</li>
				<li>
					A token represents a claim recorded by its issuer. Holding the token
					is not the same as holding the underlying asset, and the legal
					enforceability of that claim varies by jurisdiction.
				</li>
				<li>
					The regulatory treatment of tokenized instruments is unsettled and
					may change in ways that affect transferability or value.
				</li>
				<li>
					Losing access to a wallet may mean losing access to the assets it
					holds. We cannot recover keys we never hold.
				</li>
			</ul>

			<h2>Limits of automated underwriting</h2>

			<p>
				Our agents read offering documents, normalise them and score them
				against your mandate. That process is useful, and it is not infallible.
			</p>

			<ul>
				<li>
					It depends on what issuers disclose. Incomplete or inaccurate source
					documents produce incomplete or inaccurate analysis.
				</li>
				<li>
					Models can misread a document, miss context a human would catch, or
					weight a risk incorrectly.
				</li>
				<li>
					Eligibility checks reflect the rules as we understand them. An issuer
					may still decline you.
				</li>
				<li>
					Output is information, not advice, and not a recommendation. See our{" "}
					<a href="/terms">terms</a>.
				</li>
			</ul>

			<h2>Delegated execution</h2>

			<p>
				A mandate set to run unattended may settle trades without asking you
				first, within the limits you set. That is a choice you make and can
				reverse, and the trades made under it are yours. If you would rather
				approve each one, that is the default.
			</p>

			<h2>No deposit protection</h2>

			<p>
				Investments accessed through Fractionax are not bank deposits, are not
				insured by any deposit-protection or investor-compensation scheme, and
				are not guaranteed by us or by any government body.
			</p>

			<h2>Past performance</h2>

			<p>
				Past performance does not indicate future results. Where figures are
				shown for an offering, read them alongside the issuer&rsquo;s own
				documentation.
			</p>

			<h2>Get advice</h2>

			<p>
				Consider whether an investment suits your circumstances, and take
				independent financial, legal and tax advice before committing capital.
			</p>

			<h2>Contact</h2>

			<p>
				Questions about these disclosures go to{" "}
				<a href="mailto:legal@fractionax.app">legal@fractionax.app</a>.
			</p>
		</LegalPage>
	);
}
