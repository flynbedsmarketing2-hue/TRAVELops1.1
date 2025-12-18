'use client';

import { LogOut, Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "../stores/useUiStore";
import { useUserStore } from "../stores/useUserStore";
import { Button } from "./ui/button";

type Props = {
  onOpenSidebar?: () => void;
};

export default function Topbar({ onOpenSidebar }: Props) {
  const pathname = usePathname();
  const { currentUser, logout } = useUserStore();
  const { theme, toggleTheme } = useUiStore();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link
            href="/"
            className="hidden text-sm font-semibold text-slate-700 transition hover:text-primary dark:text-slate-200 lg:inline"
          >
            TravelOps
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            title="Basculer le thème"
            className="rounded-full border border-slate-200/70 bg-white/80 text-slate-900 shadow-sm shadow-slate-900/10 transition hover:border-primary hover:text-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-primary dark:hover:text-white dark:shadow-none"
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {currentUser ? (
            <>
              <span className="hidden text-sm text-slate-600 dark:text-slate-300 md:inline">
                {currentUser.username} · {currentUser.role}
              </span>
              <Button variant="secondary" onClick={() => logout()} aria-label="Se déconnecter">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link href="/login" className="inline-flex">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
