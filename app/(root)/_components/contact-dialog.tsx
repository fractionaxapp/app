"use client";

import { useActionState, useEffect, useRef } from "react";

import { siteConfig } from "@/lib/site";
import { trackEvent } from "@/lib/track-event";

import { submitEnquiry, type ContactState } from "./contact-actions";
import { Arrow, actionClass } from "./ui";

/*
 * The exit from the FAQ, for the question we did not answer.
 *
 * Built on <dialog showModal()>, so focus trapping, the top layer, inert
 * background and Escape-to-close come from the platform rather than from a
 * hand-rolled implementation that would get one of them wrong.
 *
 * The message is recorded server-side and an administrator is emailed. The
 * confirmation below is therefore true, which is the only condition under
 * which a landing page has any business showing one: until there was an
 * endpoint this handed off to a mailto: instead, because "thanks, we'll be in
 * touch" over a form that drops the message is worse than opening a mail app.
 */

const initialState: ContactState = { status: "idle" };

const fieldClass =
	"w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted/60 focus-visible:border-primary focus-visible:outline-none";

export function ContactDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const [state, formAction, pending] = useActionState(
		submitEnquiry,
		initialState,
	);

	useEffect(() => {
		const element = dialog.current;
		if (!element) return;

		if (open && !element.open) element.showModal();
		if (!open && element.open) element.close();
	}, [open]);

	const sent = state.status === "sent";

	/*
	 * Remounts the fields after a rejection so the restored values take. The
	 * key has to change for that: React resets the DOM inputs when the action
	 * resolves, and a defaultValue on an already-mounted input is ignored.
	 */
	const attempt = state.status === "error" ? state.attempt : 0;
	const kept = state.status === "error" ? state.values : null;

	return (
		<dialog
			ref={dialog}
			// Escape and backdrop clicks both route through the same close path.
			onClose={onClose}
			onClick={(event) => {
				if (event.target === dialog.current) onClose();
			}}
			aria-labelledby="contact-heading"
			className="m-auto w-[min(34rem,calc(100vw-2rem))] border border-border bg-surface text-foreground backdrop:bg-background/80 backdrop:backdrop-blur-sm"
		>
			<div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
				<p className="fx-eyebrow text-muted">
					{sent ? "Message received" : "Ask us anything"}
				</p>

				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="fx-eyebrow -mr-2 cursor-pointer px-2 py-1 text-muted transition-colors hover:text-foreground"
				>
					✕
				</button>
			</div>

			{sent ? (
				<div className="px-5 py-8">
					<h2
						id="contact-heading"
						className="text-[clamp(20px,2.2vw,30px)] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance uppercase"
					>
						We have it
					</h2>

					<p className="mt-4 text-pretty text-muted">
						A person reads these, and the reply comes from a person. If it is
						urgent, {siteConfig.contactEmail} reaches the same place.
					</p>

					<button
						type="button"
						onClick={onClose}
						className={`${actionClass("ghost")} mt-7 w-full cursor-pointer sm:w-auto sm:min-w-56`}
					>
						Close
						<Arrow />
					</button>
				</div>
			) : (
				<form
					action={formAction}
					onSubmit={() => trackEvent("contact_submit", { location: "faq" })}
				>
					<div className="px-5 py-6">
						<h2
							id="contact-heading"
							className="text-[clamp(20px,2.2vw,30px)] leading-[1.05] font-extrabold tracking-[-0.04em] text-balance uppercase"
						>
							What do you want to know?
						</h2>

						<p className="mt-3 text-pretty text-muted">
							Fees, custody, jurisdictions, timelines — whatever is not answered
							above. It reaches a person, not a queue.
						</p>

						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<div>
								<label htmlFor="contact-name" className="sr-only">
									Your name
								</label>
								<input
									key={`name-${attempt}`}
									id="contact-name"
									name="name"
									required
									maxLength={120}
									autoComplete="name"
									defaultValue={kept?.name}
									placeholder="Your name"
									className={fieldClass}
								/>
							</div>

							<div>
								<label htmlFor="contact-email" className="sr-only">
									Your email
								</label>
								<input
									key={`email-${attempt}`}
									id="contact-email"
									name="email"
									type="email"
									required
									maxLength={200}
									autoComplete="email"
									defaultValue={kept?.email}
									placeholder="you@example.com"
									className={fieldClass}
								/>
							</div>
						</div>

						<label htmlFor="contact-question" className="sr-only">
							Your question
						</label>
						<textarea
							key={`message-${attempt}`}
							id="contact-question"
							name="message"
							required
							maxLength={4000}
							rows={5}
							defaultValue={kept?.message}
							placeholder="Type your question…"
							className={`${fieldClass} mt-3 resize-y`}
						/>

						{/* Not shown, not tabbable, not announced. Anything that fills it
						    in is not a person, and the submission is quietly dropped. */}
						<div aria-hidden className="hidden">
							<label htmlFor="contact-company">Company</label>
							<input
								id="contact-company"
								name="company"
								tabIndex={-1}
								autoComplete="off"
							/>
						</div>

						{state.status === "error" ? (
							<p
								role="alert"
								className="mt-4 border-l-2 border-danger pl-3 text-sm text-pretty text-danger"
							>
								{state.message}
							</p>
						) : null}
					</div>

					<div className="flex flex-col gap-4 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-pretty text-muted">
							We use your address to reply, and for nothing else.
						</p>

						<button
							type="submit"
							disabled={pending}
							className={`${actionClass("solid")} w-full cursor-pointer disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:min-w-56`}
						>
							{pending ? "Sending…" : "Send question"}
							<Arrow />
						</button>
					</div>
				</form>
			)}
		</dialog>
	);
}
