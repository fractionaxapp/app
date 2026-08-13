"use client";

import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/wallet";

import { titleForPathname } from "./navigation";

function initialsFor(email: string | null) {
	if (!email) return "··";
	return email.slice(0, 2).toUpperCase();
}

export function AppTopbar() {
	const pathname = usePathname();
	const { isEnabled, user, signOut } = useAuth();

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
			<h1 className="font-medium">{titleForPathname(pathname)}</h1>

			{/* Account controls are meaningless without auth configured. */}
			{isEnabled ? (
				<div className="flex items-center gap-3">
					{user?.email ? (
						<span className="hidden text-muted sm:inline">{user.email}</span>
					) : null}

					<div
						aria-label="Account"
						title={user?.email ?? undefined}
						className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-medium"
					>
						{initialsFor(user?.email ?? null)}
					</div>

					<button
						type="button"
						onClick={signOut}
						className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
					>
						Sign out
					</button>
				</div>
			) : null}
		</header>
	);
}
