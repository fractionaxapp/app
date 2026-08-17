"use client";

import { useState } from "react";

import { ContactDialog } from "./contact-dialog";
import { Arrow } from "./ui";

/*
 * The last row of the FAQ. A button rather than a link, because it opens a
 * dialog rather than going anywhere — and the client boundary stays here, so
 * the section itself remains a server component.
 */
export function ContactRow({
	row,
	questionType,
}: {
	row: string;
	questionType: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className={`${row} group w-full cursor-pointer items-baseline border-b border-border py-6 text-left transition-colors hover:bg-surface-muted`}
			>
				<span className="fx-eyebrow text-muted tabular-nums">··</span>

				<span
					className={`${questionType} text-muted transition-colors group-hover:text-foreground`}
				>
					Something else?
				</span>

				<span className="justify-self-end text-primary">
					<Arrow className="size-4" />
				</span>
			</button>

			<ContactDialog open={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}
