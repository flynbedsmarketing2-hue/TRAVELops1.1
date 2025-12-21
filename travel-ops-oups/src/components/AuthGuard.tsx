'use client';

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { UserRole } from "../types";

type Props = {
  children: React.ReactNode;
  allowRoles?: UserRole[];
};

export default function AuthGuard({ children, allowRoles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [session, status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
        Chargement...
      </div>
    );
  }

  if (!session?.user) return null;

  if (allowRoles && !allowRoles.includes(session.user.role as UserRole)) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-5 w-5" />
          Accès refusé (403)
        </div>
        <p className="text-sm">
          Ton role <span className="font-semibold">{session.user.role}</span> n&rsquo;autorise pas l&rsquo;acces a cette page.
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

