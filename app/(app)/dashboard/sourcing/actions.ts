"use server";

import { refresh } from "next/cache";

import { getAccess } from "@/lib/access";
import { archiveMandate, createMandate } from "@/lib/db/sourcing";
import { findUserByPrivyDid } from "@/lib/db/users";
import { parseMandate } from "@/lib/sourcing/parse";

/*
 * Mandates belong to one account, and the account comes from the session on
 * every call. The browser says what to write and which mandate to archive; it
 * never says whose.
 */

async function requireOwner() {
	const access = await getAccess();
	if (access.state !== "approved") throw new Error("Not authorised.");

	const user = await findUserByPrivyDid(access.did);
	if (!user) throw new Error("No account record.");

	return user.id;
}

export type MandateState = { error?: string };

export async function saveMandate(
	_previous: MandateState,
	formData: FormData,
): Promise<MandateState> {
	const userId = await requireOwner();

	const statement = String(formData.get("statement") ?? "").trim();

	if (!statement) return { error: "Describe what you are looking for." };
	if (statement.length > 2000) {
		return { error: "Keep the mandate under 2,000 characters." };
	}

	const { criteria, parsedBy } = await parseMandate(statement);

	if (Object.keys(criteria).length === 0) {
		return {
			error:
				"Nothing in that reads as a constraint. Name a yield, a term, a maximum cheque, an asset class or a jurisdiction.",
		};
	}

	await createMandate({ userId, statement, criteria, parsedBy });

	refresh();
	return {};
}

export async function dropMandate(formData: FormData) {
	const userId = await requireOwner();

	const id = String(formData.get("id") ?? "");
	if (!id) throw new Error("Invalid mandate reference.");

	await archiveMandate(id, userId);

	refresh();
}
