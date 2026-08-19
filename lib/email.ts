import "server-only";

/*
 * Outbound email, through Resend's HTTP API.
 *
 * Called over fetch rather than through the SDK: this sends one kind of
 * message with three fields, and a dependency that has to be kept up to date
 * for that is a dependency that will one day break a build for nothing.
 *
 * Every failure is swallowed and reported as false. A notification that does
 * not arrive is a nuisance; an exception thrown into a visitor's submission
 * after their message is already saved would tell them it failed when it did
 * not, and they would send it again.
 */

const ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured() {
	return Boolean(
		process.env.RESEND_API_KEY &&
		process.env.CONTACT_FROM_EMAIL &&
		process.env.CONTACT_TO_EMAIL,
	);
}

export type Mail = {
	subject: string;
	text: string;
	/** Where a reply should go — the person who wrote in, not us. */
	replyTo?: string;
};

export async function sendToAdmins(mail: Mail): Promise<boolean> {
	if (!isEmailConfigured()) return false;

	try {
		const response = await fetch(ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: process.env.CONTACT_FROM_EMAIL,
				// Several addresses may be listed, comma-separated.
				to: (process.env.CONTACT_TO_EMAIL ?? "")
					.split(",")
					.map((address) => address.trim())
					.filter(Boolean),
				subject: mail.subject,
				text: mail.text,
				...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
			}),
			// Long enough for a slow API, short enough not to hold a worker.
			signal: AbortSignal.timeout(8_000),
		});

		if (!response.ok) {
			console.error(
				"Resend rejected the message",
				response.status,
				await response.text().catch(() => ""),
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Failed to send mail", error);
		return false;
	}
}
