'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import type { UserRole } from "../types";

type Props = {
  children: React.ReactNode;
  allowRoles?: UserRole[];
};

type PersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (cb: () => void) => () => void;
};

function getPersistApi(): PersistApi | undefined {
  const maybeStore = useUserStore as unknown as { persist?: PersistApi };
  return maybeStore.persist;
}

export default function AuthGuard({ children, allowRoles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, ensureAdmin } = useUserStore();
  const [hasHydrated, setHasHydrated] = useState(() => {
    const persistApi = getPersistApi();
    if (persistApi?.hasHydrated) return persistApi.hasHydrated();
    return true;
  });

  useEffect(() => {
    ensureAdmin();
  }, [ensureAdmin]);

  useEffect(() => {
    const persistApi = getPersistApi();
    if (!persistApi?.onFinishHydration) return;
    const unsubscribe = persistApi.onFinishHydration(() => setHasHydrated(true));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [currentUser, hasHydrated, pathname, router]);

  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
        Chargement...
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (allowRoles && !allowRoles.includes(currentUser.role)) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-5 w-5" />
          Accès refusé (403)
        </div>
        <p className="text-sm">
          Ton rôle <span className="font-semibold">{currentUser.role}</span> n&rsquo;autorise pas l’accès à cette page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex w-fit rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Retour au dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

