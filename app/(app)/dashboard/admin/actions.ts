"use server";

import { refresh } from "next/cache";

import { getAdmin } from "@/lib/admin";
import { setAccessStatus } from "@/lib/db/admin";
import type { AccessStatus } from "@/lib/db/users";

/*
 * A Server Action is a POST endpoint against the page, reachable by anyone who
 * can send the request. Rendering the buttons only for administrators keeps
 * honest people out of the way; it is not the boundary. The boundary is the
 * getAdmin() call below, which runs on every invocation.
 *
 * The client supplies which account to move and what to move it to, and
 * nothing else. Authority comes from the session, and the transition is
 * checked against the same three values the database constrains.
 */

const statuses: AccessStatus[] = ["waitlisted", "approved", "declined"];

function isStatus(value: unknown): value is AccessStatus {
	return typeof value === "string" && statuses.includes(value as AccessStatus);
}

/** Postgres rejects a malformed uuid with an error; check before asking it to. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setAccess(formData: FormData) {
	const admin = await getAdmin();

	// Loud, not silent. A failure here means either a bug or someone probing
	// the endpoint, and both are worth seeing in the logs.
	if (!admin) throw new Error("Not authorised to change access.");

	const userId = formData.get("userId");
	const status = formData.get("status");

	if (typeof userId !== "string" || !UUID.test(userId)) {
		throw new Error("Invalid account reference.");
	}

	if (!isStatus(status)) throw new Error("Invalid access status.");

	await setAccessStatus(userId, status, admin);

	// The page reads the database on every request, so there is no cache to
	// invalidate — only a client router holding the previous render.
	refresh();
}
