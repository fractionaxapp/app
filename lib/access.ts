import "server-only";

import { isDatabaseEnabled } from "@/lib/db/client";
import { findAccessByPrivyDid, type AccessRecord } from "@/lib/db/users";
import { getSessionUser } from "@/lib/wallet/server";

/*
 * Who may actually use the product, as opposed to who has signed in.
 *
 * Signing in is open; access is granted by hand during the private beta. These
 * are separate questions and this module answers only the second, from the
 * verified session — never from anything the browser supplied.
 *
 * Every failure path resolves to no access. An unconfigured database, an
 * unreachable one, a session that has no mirror row yet: all of them mean we
 * cannot prove this account was approved, and an access gate that cannot prove
 * approval must withhold it. Being wrong in this direction costs a legitimate
 * user a wait; being wrong in the other direction hands the product to someone
 * who was never admitted.
 */

export type Access =
	| { state: "signed-out" }
	| { state: "approved"; email: string | null; did: string }
	| {
			state: "waiting";
			email: string | null;
			status: AccessRecord["status"];
			joinedAt: Date | null;
			ahead: number | null;
			/** True when we could not read the queue, not when it is empty. */
			unknown: boolean;
	  };

export async function getAccess(): Promise<Access> {
	const user = await getSessionUser();
	if (!user) return { state: "signed-out" };

	const email = user.email?.address ?? null;

	// Nothing to read from, so nothing can be proven. Wait.
	if (!isDatabaseEnabled) {
		return {
			state: "waiting",
			email,
			status: "waitlisted",
			joinedAt: null,
			ahead: null,
			unknown: true,
		};
	}

	let record: AccessRecord | null = null;

	try {
		record = await findAccessByPrivyDid(user.id);
	} catch (error) {
		// Log for the operator; the visitor simply sees the queue.
		console.error("Failed to read access status", error);

		return {
			state: "waiting",
			email,
			status: "waitlisted",
			joinedAt: null,
			ahead: null,
			unknown: true,
		};
	}

	// The DID comes from the verified session, never from a client value —
	// every page that queries by it inherits that guarantee.
	if (record?.status === "approved")
		return { state: "approved", email, did: user.id };

	return {
		state: "waiting",
		email,
		status: record?.status ?? "waitlisted",
		joinedAt: record?.joinedAt ?? null,
		ahead: record?.ahead ?? null,
		// A missing row means the mirror has not caught up with this login yet.
		unknown: !record,
	};
}
