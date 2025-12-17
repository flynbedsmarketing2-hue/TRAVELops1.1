'use client';

import { Menu, Moon, Sun } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 lg:block">
            {pathname === "/" ? "Accueil" : "Backoffice"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            title="Basculer le thème"
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {currentUser ? (
            <>
              <span className="hidden text-sm text-slate-600 dark:text-slate-300 md:inline">
                {currentUser.username} · {currentUser.role}
              </span>
              <Button variant="secondary" onClick={() => logout()}>
                Logout
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

