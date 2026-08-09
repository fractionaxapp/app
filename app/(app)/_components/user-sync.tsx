"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/wallet";

/*
 * Fires one POST to /api/auth/sync when a session becomes active, so the
 * Postgres mirror picks up the login. Renders nothing.
 *
 * The endpoint re-derives the user from the session cookie, so this component
 * sends no body — it is a trigger, not a data source.
 */
export function UserSync() {
	const { isAuthenticated, user } = useAuth();
	const syncedFor = useRef<string | null>(null);

	useEffect(() => {
		if (!isAuthenticated || !user) return;

		// Once per user per mount; re-runs if a different account signs in.
		if (syncedFor.current === user.id) return;
		syncedFor.current = user.id;

		fetch("/api/auth/sync", { method: "POST" }).catch(() => {
			// Never surface this: the user is signed in either way and the
			// mirror catches up on their next login.
		});
	}, [isAuthenticated, user]);

	return null;
}
