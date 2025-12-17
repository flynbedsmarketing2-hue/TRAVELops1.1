import type { ComponentType } from "react";
import {
  Briefcase,
  LayoutDashboard,
  Plane,
  ShoppingCart,
  Telescope,
  Users,
} from "lucide-react";
import type { UserRole } from "../types";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles: UserRole[];
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Packages",
    href: "/packages",
    icon: Briefcase,
    roles: ["administrator", "travel_designer"],
  },
  {
    label: "Voyages",
    href: "/voyages",
    icon: Plane,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Sales",
    href: "/sales",
    icon: ShoppingCart,
    roles: ["administrator", "sales_agent"],
  },
  {
    label: "Ops",
    href: "/ops",
    icon: Telescope,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["administrator"],
  },
];

export const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(href));

