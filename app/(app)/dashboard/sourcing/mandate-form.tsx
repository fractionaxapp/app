"use client";

import { useActionState } from "react";

import { saveMandate, type MandateState } from "./actions";

/*
 * The client boundary for composing a mandate. Kept to the form so the page
 * around it stays a server component and the results are rendered from the
 * database rather than shipped to the browser and filtered there.
 */

const initial: MandateState = {};

const examples = [
	"Senior secured private credit above 8% net, under 24 months, minimum no more than $50,000.",
	"US receivables with a DSCR of at least 1.5. No crypto-collateralised deals.",
];

export function MandateForm({ aiEnabled }: { aiEnabled: boolean }) {
	const [state, action, pending] = useActionState(saveMandate, initial);

	return (
		<form action={action} className="px-5 py-5">
			<label htmlFor="statement" className="fx-eyebrow text-muted">
				What are you looking for?
			</label>

			<textarea
				id="statement"
				name="statement"
				rows={3}
				maxLength={2000}
				required
				placeholder={examples[0]}
				className="mt-3 w-full resize-y border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted/50 focus-visible:border-primary focus-visible:outline-none"
			/>

			<p className="mt-3 text-xs text-pretty text-muted">
				Plain English. Yields as percentages, terms in months or years, cheque
				sizes as amounts.{" "}
				{aiEnabled
					? "Read by the model, and you can see what it understood before anything runs."
					: "Read by the built-in parser — set ANTHROPIC_API_KEY for the model to read it instead."}
			</p>

			{state.error ? (
				<p
					role="alert"
					className="mt-4 border-l-2 border-danger pl-3 text-sm text-pretty text-danger"
				>
					{state.error}
				</p>
			) : null}

			<div className="mt-5 flex flex-wrap items-center gap-3">
				<button
					type="submit"
					disabled={pending}
					className="fx-eyebrow inline-flex min-h-11 cursor-pointer items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-40"
				>
					{pending ? "Reading…" : "Add mandate"}
				</button>

				<span className="text-xs text-muted">
					Example: {examples[1]}
				</span>
			</div>
		</form>
	);
}
