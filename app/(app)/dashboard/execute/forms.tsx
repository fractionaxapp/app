"use client";

import { useActionState } from "react";

import {
	planAllocation,
	updatePolicy,
	type PlanState,
	type PolicyState,
} from "./actions";

/*
 * The two forms that answer back. Everything else on this screen is a plain
 * server action, because everything else either works or throws.
 */

const field =
	"min-h-10 w-full border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted/50 focus-visible:border-primary focus-visible:outline-none";

const solid =
	"fx-eyebrow inline-flex min-h-10 cursor-pointer items-center border border-primary bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-40";

function Message({ state }: { state: { error?: string; ok?: string } }) {
	if (state.error) {
		return (
			<p
				role="alert"
				className="border-l-2 border-danger pl-3 text-sm text-pretty text-danger"
			>
				{state.error}
			</p>
		);
	}

	if (state.ok) {
		return (
			<p className="border-l-2 border-primary pl-3 text-sm text-pretty text-primary">
				{state.ok}
			</p>
		);
	}

	return null;
}

export function PolicyForm({
	maxPerAllocation,
	maxTotal,
	currency,
}: {
	maxPerAllocation: string | null;
	maxTotal: string | null;
	currency: string;
}) {
	const [state, action, pending] = useActionState<PolicyState, FormData>(
		updatePolicy,
		{},
	);

	return (
		<form action={action} className="flex flex-col gap-4 px-5 py-5">
			<div className="grid gap-4 sm:grid-cols-[1fr_1fr_6rem]">
				<label>
					<span className="fx-eyebrow text-muted">Most per allocation</span>
					<input
						name="maxPerAllocation"
						defaultValue={maxPerAllocation ?? ""}
						placeholder="no limit"
						className={`${field} mt-2`}
					/>
				</label>

				<label>
					<span className="fx-eyebrow text-muted">Most in total</span>
					<input
						name="maxTotal"
						defaultValue={maxTotal ?? ""}
						placeholder="no limit"
						className={`${field} mt-2`}
					/>
				</label>

				<label>
					<span className="fx-eyebrow text-muted">Currency</span>
					<input
						name="currency"
						defaultValue={currency}
						maxLength={5}
						className={`${field} mt-2`}
					/>
				</label>
			</div>

			<Message state={state} />

			<div>
				<button type="submit" disabled={pending} className={solid}>
					{pending ? "Saving…" : "Save limits"}
				</button>
			</div>
		</form>
	);
}

export function PlanForm({
	offeringId,
	minimum,
	currency,
}: {
	offeringId: string;
	minimum: string | null;
	currency: string | null;
}) {
	const [state, action, pending] = useActionState<PlanState, FormData>(
		planAllocation,
		{},
	);

	return (
		<form action={action} className="mt-4 flex flex-col gap-3">
			<input type="hidden" name="offeringId" value={offeringId} />

			<div className="flex flex-wrap items-end gap-3">
				<label className="min-w-40 flex-1">
					<span className="fx-eyebrow text-muted">
						Amount{currency ? ` (${currency})` : ""}
					</span>
					<input
						name="amount"
						inputMode="decimal"
						defaultValue={minimum ?? ""}
						placeholder={minimum ? `minimum ${minimum}` : "amount"}
						className={`${field} mt-2`}
					/>
				</label>

				<label className="min-w-52 flex-[2]">
					<span className="fx-eyebrow text-muted">Note</span>
					<input
						name="note"
						maxLength={2000}
						placeholder="why this size"
						className={`${field} mt-2`}
					/>
				</label>

				<button type="submit" disabled={pending} className={solid}>
					{pending ? "Checking…" : "Plan allocation"}
				</button>
			</div>

			<Message state={state} />
		</form>
	);
}
