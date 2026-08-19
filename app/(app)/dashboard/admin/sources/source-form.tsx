"use client";

import { useActionState } from "react";

import { addSource, type SourceState } from "./actions";

const initial: SourceState = {};

const fieldClass =
	"w-full border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted/50 focus-visible:border-primary focus-visible:outline-none";

const EXAMPLE = `{
  "items": "data.offerings",
  "externalId": "id",
  "title": "name",
  "netYield": "terms.apy",
  "termMonths": "terms.months",
  "minimum": "terms.min_investment"
}`;

export function SourceForm({ devEnabled }: { devEnabled: boolean }) {
	const [state, action, pending] = useActionState(addSource, initial);

	return (
		<form action={action} className="flex flex-col gap-4 px-5 py-5">
			<div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
				<div>
					<label htmlFor="source-label" className="fx-eyebrow text-muted">
						Venue
					</label>
					<input
						id="source-label"
						name="label"
						required
						maxLength={120}
						placeholder="Example Issuance"
						className={`${fieldClass} mt-2`}
					/>
				</div>

				<div>
					<label htmlFor="source-kind" className="fx-eyebrow text-muted">
						Kind
					</label>
					<select
						id="source-kind"
						name="kind"
						defaultValue="json"
						className={`${fieldClass} mt-2`}
					>
						<option value="json">JSON</option>
						<option value="rss">RSS</option>
						{devEnabled ? <option value="rwa">rwa.xyz (dev)</option> : null}
					</select>
				</div>
			</div>

			<div>
				<label htmlFor="source-url" className="fx-eyebrow text-muted">
					Endpoint
				</label>
				<input
					id="source-url"
					name="url"
					type="url"
					placeholder="https://venue.example/api/offerings"
					className={`${fieldClass} mt-2`}
				/>
				{devEnabled ? (
					<p className="mt-2 text-xs text-muted">
						Not needed for the rwa.xyz reader — it finds its own, because the
						address contains their deploy hash.
					</p>
				) : null}
			</div>

			<div>
				<label htmlFor="source-mapping" className="fx-eyebrow text-muted">
					Field mapping
					<span className="ml-2 normal-case opacity-70">optional</span>
				</label>
				<textarea
					id="source-mapping"
					name="mapping"
					rows={6}
					placeholder={EXAMPLE}
					className={`${fieldClass} mt-2 resize-y`}
				/>
				<p className="mt-2 text-xs text-pretty text-muted">
					Where each field lives in their payload. Left empty, the adapter tries
					the obvious names — title, yield, term, minimum — and leaves the rest
					null, which shows up as unverifiable rather than as a guess.
				</p>
			</div>

			{state.error ? (
				<p
					role="alert"
					className="border-l-2 border-danger pl-3 text-sm text-pretty text-danger"
				>
					{state.error}
				</p>
			) : null}

			{state.ok ? (
				<p className="border-l-2 border-primary pl-3 text-sm text-pretty text-primary">
					{state.ok}
				</p>
			) : null}

			<div>
				<button
					type="submit"
					disabled={pending}
					className="fx-eyebrow inline-flex min-h-11 cursor-pointer items-center border border-primary bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-40"
				>
					{pending ? "Saving…" : "Add venue"}
				</button>
			</div>
		</form>
	);
}
