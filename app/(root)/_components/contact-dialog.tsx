"use client";

import { useEffect, useRef, useState } from "react";

import { trackEvent } from "@/lib/track-event";

import { Arrow, actionClass } from "./ui";

/*
 * The exit from the FAQ, for the question we did not answer.
 *
 * Built on <dialog showModal()>, so focus trapping, the top layer, inert
 * background and Escape-to-close come from the platform rather than from a
 * hand-rolled implementation that would get one of them wrong.
 *
 * There is no endpoint yet, and this deliberately does not pretend otherwise:
 * submitting hands off to a mailto: rather than showing a fake success state.
 * A landing page that says "thanks, we'll be in touch" and drops the message
 * is worse than one that opens a mail client.
 */

const CONTACT_EMAIL = "hello@fractionax.app";

export function ContactDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const [question, setQuestion] = useState("");

	useEffect(() => {
		const element = dialog.current;
		if (!element) return;

		if (open && !element.open) element.showModal();
		if (!open && element.open) element.close();
	}, [open]);

	const send = () => {
		trackEvent("contact_submit", { location: "faq" });

		const subject = encodeURIComponent("Question about Fractionax");
		const body = encodeURIComponent(question);
		window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
	};

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
				<p className="fx-eyebrow text-muted">Ask us anything</p>

				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="fx-eyebrow -mr-2 cursor-pointer px-2 py-1 text-muted transition-colors hover:text-foreground"
				>
					✕
				</button>
			</div>

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

				<label htmlFor="contact-question" className="sr-only">
					Your question
				</label>
				<textarea
					id="contact-question"
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
					rows={5}
					placeholder="Type your question…"
					className="mt-6 w-full resize-y border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted/60 focus-visible:border-primary focus-visible:outline-none"
				/>
			</div>

			<div className="flex flex-col gap-4 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-xs text-pretty text-muted">
					Opens your mail app, addressed to {CONTACT_EMAIL}.
				</p>

				<button
					type="button"
					onClick={send}
					disabled={question.trim().length === 0}
					className={`${actionClass("solid")} w-full cursor-pointer disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:min-w-56`}
				>
					Send question
					<Arrow />
				</button>
			</div>
		</dialog>
	);
}
