"use server";

import { refresh } from "next/cache";

import { getAdmin } from "@/lib/admin";
import { setEnquiryStatus, type EnquiryStatus } from "@/lib/db/enquiries";

/*
 * Same rule as the access actions: the button being rendered proves nothing,
 * because the endpoint it posts to can be called without the page. Authority
 * is re-derived from the session here, on every call.
 */

const statuses: EnquiryStatus[] = ["new", "handled"];

export async function setEnquiry(formData: FormData) {
	const admin = await getAdmin();
	if (!admin) throw new Error("Not authorised to change enquiries.");

	const id = formData.get("id");
	const status = formData.get("status");

	// bigserial: digits only, and bounded so a silly value never reaches pg.
	if (typeof id !== "string" || !/^\d{1,19}$/.test(id)) {
		throw new Error("Invalid enquiry reference.");
	}

	if (
		typeof status !== "string" ||
		!statuses.includes(status as EnquiryStatus)
	) {
		throw new Error("Invalid enquiry status.");
	}

	await setEnquiryStatus(id, status as EnquiryStatus, admin.did);

	refresh();
}
