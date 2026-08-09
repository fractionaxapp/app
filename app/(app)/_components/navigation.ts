/* Single source of truth for the (app) chrome: sidebar links and topbar title. */
export const navigation = [{ href: "/dashboard", label: "Overview" }] as const;

export function titleForPathname(pathname: string) {
	return navigation.find((item) => item.href === pathname)?.label ?? "Dashboard";
}
