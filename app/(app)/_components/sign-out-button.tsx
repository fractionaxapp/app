"use client";

import { useAuth } from "@/lib/wallet";

/*
 * The client boundary for signing out. Kept to this button so the settings
 * page itself stays a server component and never ships the wallet SDK's
 * surface area for the sake of one action.
 */
export function SignOutButton() {
	const { isEnabled, signOut } = useAuth();

	if (!isEnabled) return null;

	return (
		<button
			type="button"
			onClick={signOut}
			className="fx-eyebrow inline-flex min-h-11 cursor-pointer items-center border border-border px-5 font-semibold transition-colors hover:border-foreground"
		>
			Sign out
		</button>
	);
}
