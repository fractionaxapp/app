"use server";

import { headers } from "next/headers";
import { after } from "next/server";

import { isDatabaseEnabled } from "@/lib/db/client";
import {
	createEnquiry,
	markNotified,
	recentEnquiryCount,
} from "@/lib/db/enquiries";
import { sendToAdmins } from "@/lib/email";
import { siteConfig } from "@/lib/site";

/*
 * The one endpoint on this site that an anonymous visitor can write to.
 *
 * It is treated accordingly: every field is length-capped before it reaches
 * Postgres, a hidden field catches the bots that fill in everything they find,
 * and one address may only send a handful of messages an hour.
 *
 * The message is stored first and the notification sent afterwards. That order
 * is the whole design — mail is the part that can fail, and a question that
 * reached the database is answered late rather than lost.
 */

export type ContactState =
	| { status: "idle" }
	| { status: "sent" }
	| { status: "error"; message: string };

const LIMITS = { name: 120, email: 200, message: 4000 };

/** Deliberately loose. The address is verified by replying to it, not by a regex. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Messages one address may send in an hour before we stop recording them. */
const PER_HOUR = 5;

function field(formData: FormData, name: string) {
	const value = formData.get(name);
	return typeof value === "string" ? value.trim() : "";
}

export async function submitEnquiry(
	_previous: ContactState,
	formData: FormData,
): Promise<ContactState> {
	// A field no human sees and no human fills in.
	if (field(formData, "company")) return { status: "sent" };

	const name = field(formData, "name");
	const email = field(formData, "email");
	const message = field(formData, "message");

	if (!name || name.length > LIMITS.name) {
		return { status: "error", message: "Please give us a name to reply to." };
	}

	if (!EMAIL.test(email) || email.length > LIMITS.email) {
		return {
			status: "error",
			message: "That email address does not look right.",
		};
	}

	if (!message || message.length > LIMITS.message) {
		return {
			status: "error",
			message: message
				? `Please keep it under ${LIMITS.message.toLocaleString()} characters.`
				: "Tell us what you want to know.",
		};
	}

	if (!isDatabaseEnabled) {
		return {
			status: "error",
			message: `We cannot record messages right now — please write to ${siteConfig.contactEmail} instead.`,
		};
	}

	const requestHeaders = await headers();
	const ip =
		requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip");

	try {
		if ((await recentEnquiryCount(ip)) >= PER_HOUR) {
			return {
				status: "error",
				message: `That is a lot of questions in one hour. Write to ${siteConfig.contactEmail} and we will pick it up there.`,
			};
		}

		const id = await createEnquiry({
			name,
			email,
			message,
			ip,
			userAgent: requestHeaders.get("user-agent"),
		});

		/*
		 * After the response, so the visitor is not waiting on Resend. If it
		 * never sends, `notified` stays false and the enquiry still shows up on
		 * the admin screen — which is why that column is displayed there.
		 */
		after(async () => {
			const sent = await sendToAdmins({
				subject: `Question from ${name}`,
				replyTo: email,
				text: [
					`${name} <${email}> asked:`,
					"",
					message,
					"",
					`— via the ${siteConfig.name} landing page`,
				].join("\n"),
			});

			if (sent) await markNotified(id);
		});

		return { status: "sent" };
	} catch (error) {
		console.error("Failed to record enquiry", error);

		return {
			status: "error",
			message: `Something went wrong at our end — please write to ${siteConfig.contactEmail}.`,
		};
	}
}
