'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";
import type { UserRole } from "../types";
import { isActive, navItems } from "./navigation";
import { cn } from "./ui/cn";

type Props = {
  role?: UserRole;
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ role, open = false, onClose }: Props) {
  const pathname = usePathname();
  const items = role ? navItems.filter((i) => i.roles.includes(role)) : [];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-[280px] border-r border-slate-200/70 bg-white/80 backdrop-blur transition-transform dark:border-slate-800/70 dark:bg-slate-950/60 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center gap-2 px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-heading text-base font-semibold text-slate-900 dark:text-slate-100"
          onClick={() => onClose?.()}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plane className="h-5 w-5" />
          </span>
          TravelOps
        </Link>
      </div>

      <div className="px-3">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Menu
        </p>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {!items.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-300">
              Connecte-toi pour voir le menu.
            </div>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
