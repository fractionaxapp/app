import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { isDatabaseEnabled } from "@/lib/db/client";
import { upsertUserFromPrivy } from "@/lib/db/users";
import {
	ACCESS_TOKEN_COOKIE,
	IDENTITY_TOKEN_COOKIE,
	isServerAuthConfigured,
	loginMethodOf,
	resolveUser,
	toUserSnapshot,
	verifySession,
} from "@/lib/wallet/server";

/*
 * Mirrors the signed-in Privy user into Postgres.
 *
 * Called by the client after login, but it trusts nothing the client sends:
 * the identity comes from verifying the session cookie server-side. A request
 * with a forged body cannot write a row for someone else.
 *
 * Failures here never block sign-in — Privy remains the source of truth for
 * authentication and the mirror can catch up on the next login.
 */
export async function POST() {
	if (!isServerAuthConfigured) {
		return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
	}

	const cookieStore = await cookies();
	const session = await verifySession(
		cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
	);

	if (!session) {
		return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
	}

	// Checked after authentication so anonymous callers learn nothing about
	// how the backend is provisioned.
	if (!isDatabaseEnabled) {
		return NextResponse.json(
			{ error: "database_not_configured" },
			{ status: 503 },
		);
	}

	const user = await resolveUser(
		session.userId,
		cookieStore.get(IDENTITY_TOKEN_COOKIE)?.value,
	);

	if (!user) {
		return NextResponse.json({ error: "user_not_found" }, { status: 404 });
	}

	const headerList = await headers();

	try {
		const record = await upsertUserFromPrivy(toUserSnapshot(user), {
			method: loginMethodOf(user),
			ip:
				headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip") ?? null,
			userAgent: headerList.get("user-agent"),
		});

		return NextResponse.json({ id: record.id });
	} catch (error) {
		// Log for the operator; the user stays signed in regardless.
		console.error("Failed to mirror Privy user into Postgres", error);
		return NextResponse.json({ error: "sync_failed" }, { status: 500 });
	}
}
