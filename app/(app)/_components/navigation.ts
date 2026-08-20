/* Single source of truth for the (app) chrome: sidebar links and topbar title. */

export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: readonly NavItem[] };

export const navigation: readonly NavGroup[] = [
	{
		label: "Workspace",
		items: [
			{ href: "/dashboard", label: "Overview" },
			{ href: "/dashboard/discover", label: "Discover" },
			{ href: "/dashboard/sourcing", label: "Sourcing" },
			{ href: "/dashboard/underwrite", label: "Underwrite" },
		],
	},
	{
		label: "Account",
		items: [
			{ href: "/dashboard/profile", label: "Profile" },
			{ href: "/dashboard/settings", label: "Settings" },
		],
	},
];

/*
 * Shown only to administrators, and in a group of its own: running the beta is
 * a different job from using it, and a link that admits people should not sit
 * in the same list as one that shows your own wallets.
 *
 * Kept out of `navigation` so the sidebar cannot render it by accident, though
 * the link is the least of it: the route itself renders nothing to anyone who
 * is not an administrator.
 */
export const adminNavigation: readonly NavGroup[] = [
	{
		label: "Administration",
		items: [
			{ href: "/dashboard/admin", label: "Access" },
			{ href: "/dashboard/admin/enquiries", label: "Enquiries" },
			{ href: "/dashboard/admin/sources", label: "Sources" },
		],
	},
];

export function titleForPathname(pathname: string) {
	for (const group of [...navigation, ...adminNavigation]) {
		for (const item of group.items) {
			if (item.href === pathname) return item.label;
		}
	}

	return "Dashboard";
}
