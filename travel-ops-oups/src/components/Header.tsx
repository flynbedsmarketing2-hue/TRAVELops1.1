'use client';

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Plane,
  ShoppingCart,
  Telescope,
  LayoutPanelTop,
  Globe,
  Warehouse,
  Megaphone,
  Users,
  LogOut,
  LogIn,
  Moon,
  Sun,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useUiStore } from "../stores/useUiStore";
import type { UserRole } from "../types";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const navItems: NavItem[] = [
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
    label: "Factory",
    href: "/factory",
    icon: LayoutPanelTop,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Intelligence",
    href: "/intelligence",
    icon: Globe,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: Warehouse,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Publishing",
    href: "/publishing",
    icon: Megaphone,
    roles: ["administrator", "travel_designer", "sales_agent", "viewer"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["administrator"],
  },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(href));

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useUiStore();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold text-primary"
        >
          <Plane className="h-5 w-5" />
          TravelOps Platform
        </Link>

        <nav className="flex items-center gap-2">
          {navItems
            .filter((item) =>
              session?.user?.role ? item.roles.includes(session.user.role as UserRole) : false
            )
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:bg-slate-900/60"
            aria-label="Basculer le thème"
            title="Basculer le thème"
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {session?.user ? (
            <>
              <span className="hidden text-sm text-slate-600 md:inline dark:text-slate-300">
                {session.user.username} - {session.user.role}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

