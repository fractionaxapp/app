"use client";

import { useState } from "react";

import { useAuth, useWallet } from "@/lib/wallet";

import { Panel } from "../../_components/panel";

/*
 * The address a venue delivers to, made at the moment it is wanted.
 *
 * This screen is the only place in the product that creates a wallet, and it
 * only appears once there is something to allocate against — an account that
 * signs up, reads, and leaves never has one made for it. That is a cost
 * decision (vendors bill per wallet) and a plainer one: custody of something
 * nobody asked for is not a courtesy.
 *
 * Creation is a button rather than a side effect of submitting the form above
 * it, so nobody ends up holding a wallet they did not mean to ask for.
 */

const meta = "font-mono text-xs tracking-wide text-muted";

function Address({ address }: { address: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<code className="min-w-0 border border-border bg-background px-3 py-2 font-mono text-sm break-all">
				{address}
			</code>

			<button
				type="button"
				onClick={() => {
					navigator.clipboard
						.writeText(address)
						.then(() => setCopied(true))
						.catch(() => setCopied(false));
				}}
				className="fx-eyebrow min-h-9 cursor-pointer border border-border px-3 text-muted transition-colors hover:border-primary hover:text-primary"
			>
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}

export function ReceivingWallet() {
	const { isEnabled } = useAuth();
	const { isReady, embedded, wallets, isCreating, error, ensureWallet } =
		useWallet();

	// No auth vendor configured: there is nothing to create and nothing to say.
	if (!isEnabled) return null;

	const connected = wallets.filter((wallet) => !wallet.isEmbedded);
	const wallet = embedded ?? connected[0] ?? null;

	return (
		<Panel
			title="Receiving wallet"
			status={
				wallet ? (
					<span className="text-primary">
						{wallet.isEmbedded ? "Held for you" : "Connected"}
					</span>
				) : (
					<span className="text-muted">
						{isReady ? "None yet" : "Checking"}
					</span>
				)
			}
		>
			<div className="flex flex-col gap-5 px-5 py-6">
				{wallet ? (
					<>
						<Address address={wallet.address} />

						<p className="text-sm text-pretty text-muted">
							Give this to the venue as the delivery address when you subscribe.
							Check it against what the venue shows you before confirming — a
							transfer to a wrong address is not reversible by anyone, including
							us.
						</p>

						<p className={meta}>
							{wallet.isEmbedded
								? "Held on your behalf by the wallet provider. Nothing in this product sends a transaction from it."
								: "Your own wallet, connected at sign-in. This product never holds its keys."}
						</p>
					</>
				) : (
					<>
						<p className="text-pretty text-muted">
							Subscribing at a venue means giving it somewhere to deliver what
							you buy. You do not have an address yet — none was made when you
							signed up, and none is made until you ask for one here.
						</p>

						<div>
							<button
								type="button"
								disabled={!isReady || isCreating}
								onClick={() => void ensureWallet()}
								className="fx-eyebrow inline-flex min-h-11 cursor-pointer items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-40"
							>
								{isCreating ? "Creating…" : "Create a wallet"}
							</button>
						</div>

						<p className={meta}>
							Made by the wallet provider and held for you. You can export it to
							a wallet of your own at any time.
						</p>
					</>
				)}

				{error ? (
					<p
						role="alert"
						className="border-l-2 border-danger pl-3 text-sm text-pretty text-danger"
					>
						{error}
					</p>
				) : null}
			</div>
		</Panel>
	);
}
