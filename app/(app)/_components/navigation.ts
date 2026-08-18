/* Single source of truth for the (app) chrome: sidebar links and topbar title. */
export const navigation = [
	{ href: "/dashboard", label: "Overview" },
	{ href: "/dashboard/profile", label: "Profile" },
	{ href: "/dashboard/settings", label: "Settings" },
] as const;

/*
 * Shown only to administrators. Kept out of `navigation` so the sidebar cannot
 * render it by accident, though the link is the least of it: the route itself
 * renders nothing to anyone who is not one.
 */
export const adminNavigation = [
	{ href: "/dashboard/admin", label: "Access" },
] as const;

export function titleForPathname(pathname: string) {
	return (
		[...navigation, ...adminNavigation].find((item) => item.href === pathname)
			?.label ?? "Dashboard"
	);
}
