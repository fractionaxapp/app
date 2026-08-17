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
		<header className="flex h-14 shrink-0 items-stretch justify-between border-b border-border bg-surface">
			<h1 className="flex items-center px-6 text-sm font-extrabold tracking-[-0.02em] uppercase">
				{titleForPathname(pathname)}
			</h1>

			{/* Account controls are meaningless without auth configured. */}
			{isEnabled ? (
				<div className="flex items-stretch">
					{user?.email ? (
						<span className="hidden items-center border-l border-border px-4 font-mono text-xs text-muted sm:flex">
							{user.email}
						</span>
					) : null}

					<span
						aria-label="Account"
						title={user?.email ?? undefined}
						className="fx-eyebrow flex w-14 items-center justify-center border-l border-border text-primary"
					>
						{initialsFor(user?.email ?? null)}
					</span>

					<button
						type="button"
						onClick={signOut}
						className="fx-eyebrow cursor-pointer border-l border-border px-5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
					>
						Sign out
					</button>
				</div>
			) : null}
		</header>
	);
}
