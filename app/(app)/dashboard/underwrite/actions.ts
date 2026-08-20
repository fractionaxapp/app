"use server";

import { refresh } from "next/cache";

import { getAccess } from "@/lib/access";
import {
	clearDecision,
	recordDecision,
	type Verdict,
} from "@/lib/db/underwriting";
import { findUserByPrivyDid } from "@/lib/db/users";

/*
 * A decision belongs to one account, and the account comes from the session on
 * every call. The browser says which offering and what it decided; it never
 * says whose decision it is.
 */

const VERDICTS: Verdict[] = ["accepted", "watching", "rejected"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireOwner() {
	const access = await getAccess();
	if (access.state !== "approved") throw new Error("Not authorised.");

	const user = await findUserByPrivyDid(access.did);
	if (!user) throw new Error("No account record.");

	return user.id;
}

export async function decide(formData: FormData) {
	const userId = await requireOwner();

	const offeringId = String(formData.get("offeringId") ?? "");
	const verdict = String(formData.get("verdict") ?? "");
	const note = String(formData.get("note") ?? "")
		.trim()
		.slice(0, 2000);

	if (!UUID.test(offeringId)) throw new Error("Invalid offering reference.");

	// Clearing is a decision too: it puts the offering back in the queue.
	if (verdict === "clear") {
		await clearDecision(userId, offeringId);
		refresh();
		return;
	}

	if (!VERDICTS.includes(verdict as Verdict)) {
		throw new Error("Invalid verdict.");
	}

	await recordDecision({
		userId,
		offeringId,
		verdict: verdict as Verdict,
		note: note || null,
	});

	refresh();
}
