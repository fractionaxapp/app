import { NextResponse, type NextRequest } from "next/server";

/*
 * Next 16 renamed the `middleware` convention to `proxy`; the exported
 * function must be named `proxy`.
 *
 * This is a cheap early gate, NOT the security boundary. Proxy code may be
 * deployed to a CDN and must stay self-contained — no shared modules, no
 * globals — so it cannot pull in the Privy SDK to verify signatures. It
 * therefore only checks that a session cookie is *present*, which a user could
 * trivially fake.
 *
 * Real verification happens per request in getSessionUser() (lib/wallet/
 * server.ts), which every route exposing user data must call.
 *
 * The matcher deliberately excludes /dashboard itself: that route doubles as
 * the sign-in entry point, and redirecting anonymous visitors away from it
 * would leave them nowhere to log in.
 */

/** Duplicated from lib/wallet/server.ts rather than imported — see above. */
const ACCESS_TOKEN_COOKIE = "privy-token";

export function proxy(request: NextRequest) {
	const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

	if (hasSession) return NextResponse.next();

	const signInUrl = new URL("/dashboard", request.url);
	signInUrl.searchParams.set("from", request.nextUrl.pathname);

	return NextResponse.redirect(signInUrl);
}

export const config = {
	// Sub-routes of the dashboard only; /dashboard is handled by the auth gate.
	matcher: "/dashboard/:path+",
};
