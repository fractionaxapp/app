"use server";

import { refresh } from "next/cache";

import { getAccess } from "@/lib/access";
import {
	committed,
	createAllocation,
	findPolicy,
	savePolicy,
	setAllocationStatus,
	type AllocationStatus,
} from "@/lib/db/execution";
import { findOffering } from "@/lib/db/sourcing";
import { findUserByPrivyDid } from "@/lib/db/users";

/*
 * The limits are checked here, on the server, against the offering as stored
 * and the policy as stored — never against anything the form carried. A limit
 * that can be edited by the page it constrains is not a limit.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireOwner() {
	const access = await getAccess();
	if (access.state !== "approved") throw new Error("Not authorised.");

	const user = await findUserByPrivyDid(access.did);
	if (!user) throw new Error("No account record.");

	return user.id;
}

/** Amounts arrive as typed: "25,000", "$25000", "25000.50". */
function toAmount(input: FormDataEntryValue | null) {
	if (typeof input !== "string") return null;

	const cleaned = input.replace(/[^0-9.]/g, "");
	if (!cleaned) return null;

	const amount = Number.parseFloat(cleaned);
	return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export type PolicyState = { error?: string; ok?: string };

export async function updatePolicy(
	_previous: PolicyState,
	formData: FormData,
): Promise<PolicyState> {
	const userId = await requireOwner();

	const perAllocation = toAmount(formData.get("maxPerAllocation"));
	const total = toAmount(formData.get("maxTotal"));
	const currency =
		String(formData.get("currency") ?? "USD")
			.toUpperCase()
			.replace(/[^A-Z]/g, "")
			.slice(0, 5) || "USD";

	if (perAllocation && total && perAllocation > total) {
		return {
			error:
				"A single allocation cannot be larger than everything you will commit.",
		};
	}

	await savePolicy({
		userId,
		maxPerAllocation: perAllocation,
		maxTotal: total,
		currency,
	});

	refresh();
	return {
		ok: "Limits saved. They are checked before an allocation is planned.",
	};
}

export type PlanState = { error?: string; ok?: string };

export async function planAllocation(
	_previous: PlanState,
	formData: FormData,
): Promise<PlanState> {
	const userId = await requireOwner();

	const offeringId = String(formData.get("offeringId") ?? "");
	if (!UUID.test(offeringId)) return { error: "Invalid offering reference." };

	const amount = toAmount(formData.get("amount"));
	if (!amount) return { error: "Enter an amount to allocate." };

	const offering = await findOffering(offeringId);
	if (!offering) return { error: "That offering is no longer in the index." };

	if (offering.withdrawn_at) {
		return { error: "That offering has been withdrawn at the venue." };
	}

	const minimum = offering.minimum ? Number.parseFloat(offering.minimum) : null;

	if (minimum && amount < minimum) {
		return {
			error: `Below the venue's minimum of ${minimum.toLocaleString("en-GB")}${
				offering.currency ? ` ${offering.currency}` : ""
			}.`,
		};
	}

	const policy = await findPolicy(userId);
	const perAllocation = policy?.max_per_allocation
		? Number.parseFloat(policy.max_per_allocation)
		: null;

	if (perAllocation && amount > perAllocation) {
		return {
			error: `Over your limit of ${perAllocation.toLocaleString("en-GB")} for a single allocation.`,
		};
	}

	const maxTotal = policy?.max_total
		? Number.parseFloat(policy.max_total)
		: null;

	if (maxTotal) {
		const { planned, executed } = await committed(userId);
		const after = planned + executed + amount;

		if (after > maxTotal) {
			return {
				error: `That would commit ${after.toLocaleString("en-GB")} against a limit of ${maxTotal.toLocaleString("en-GB")}.`,
			};
		}
	}

	await createAllocation({
		userId,
		offeringId,
		amount,
		currency: offering.currency ?? policy?.currency ?? "USD",
		note:
			String(formData.get("note") ?? "")
				.trim()
				.slice(0, 2000) || null,
	});

	refresh();
	return {
		ok: "Planned. Nothing has been sent anywhere — settle it at the venue.",
	};
}

export async function markAllocation(formData: FormData) {
	const userId = await requireOwner();

	const id = String(formData.get("id") ?? "");
	const status = String(formData.get("status") ?? "");

	if (!UUID.test(id)) throw new Error("Invalid allocation reference.");

	if (status !== "executed" && status !== "cancelled" && status !== "planned") {
		throw new Error("Invalid status.");
	}

	await setAllocationStatus({
		userId,
		id,
		status: status as AllocationStatus,
		reference:
			String(formData.get("reference") ?? "")
				.trim()
				.slice(0, 200) || null,
	});

	refresh();
}
