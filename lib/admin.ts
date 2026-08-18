import "server-only";

import { connection } from "next/server";

import { getSessionUser } from "@/lib/wallet/server";

/*
 * Who may admit other people, as opposed to who has been admitted.
 *
 * This is deliberately not a column on users. A flag in the database can be
 * flipped by anything that can write to the database, including a bug in the
 * product itself; an environment variable can only be changed by someone with
 * access to the server. Administration of the access gate should not be
 * reachable from inside the thing it gates.
 *
 * Both lists are empty by default, so an unconfigured deployment has no
 * administrators at all and the screen does not exist. That is the safe
 * direction: the cost is that the first administrator is named by hand.
 */

export type Admin = { did: string; email: string | null };

function allowlist(name: string) {
	// Read per call rather than at module scope, so changing the variable takes
	// effect on restart rather than requiring a rebuild.
	return (process.env[name] ?? "")
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
}

export function isAdminConfigured() {
	return (
		allowlist("ADMIN_PRIVY_DIDS").length > 0 ||
		allowlist("ADMIN_EMAILS").length > 0
	);
}

/**
 * The administrator behind this request, or null. Identity comes from the
 * verified session; the allowlists come from the environment. Nothing here
 * reads a value the browser supplied.
 *
 * Call this in the page *and* again inside every action it renders. A page
 * that only renders a button for administrators is not a security boundary,
 * because the action it posts to can be called without the page.
 */
export async function getAdmin(): Promise<Admin | null> {
	/*
	 * Before any early return. Without it, a build with ADMIN_* unset would
	 * take the branch below, never touch cookies, and prerender the caller as
	 * static — baking one anonymous answer into a page whose entire job is to
	 * differ per request.
	 */
	await connection();

	if (!isAdminConfigured()) return null;

	const user = await getSessionUser();
	if (!user) return null;

	// Same fallback the user mirror uses: a Google sign-in carries the address
	// on the google account rather than on email, and an administrator named by
	// email should match either way.
	const email = user.email?.address ?? user.google?.email ?? null;

	const byDid = allowlist("ADMIN_PRIVY_DIDS").includes(user.id.toLowerCase());
	const byEmail = Boolean(
		email && allowlist("ADMIN_EMAILS").includes(email.toLowerCase()),
	);

	if (!byDid && !byEmail) return null;

	return { did: user.id, email };
}
