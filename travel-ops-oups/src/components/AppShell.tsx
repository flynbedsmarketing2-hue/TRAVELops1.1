'use client';

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUserStore } from "../stores/useUserStore";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useUserStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/login") {
    return <main className="px-6 py-10">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      {currentUser ? (
        <>
          <Sidebar
            role={currentUser.role}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          {sidebarOpen ? (
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-30 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

