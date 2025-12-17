'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useUserStore } from "../../stores/useUserStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, ensureAdmin, currentUser } = useUserStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [nextPath] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("next");
  });

  useEffect(() => {
    ensureAdmin();
  }, [ensureAdmin]);

  useEffect(() => {
    if (currentUser) {
      router.replace(nextPath || "/dashboard");
    }
  }, [currentUser, router, nextPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(username.trim(), password.trim());
    if (!result.success) {
      setError(result.message ?? "Impossible de se connecter");
      return;
    }
    router.replace(nextPath || "/dashboard");
  };

  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center rounded-2xl bg-white p-10 shadow-sm dark:bg-slate-950/50">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-primary">TravelOps</p>
            <h1 className="font-heading text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Connexion backoffice
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-background-light p-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
              placeholder="admin"
              autoComplete="username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
              placeholder="password"
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <LockKeyhole className="h-4 w-4" />
            Se connecter
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-300">
            Admin seed disponible : <strong>admin / password</strong>. Les comptes sont stockés dans votre navigateur via{" "}
            localStorage.
          </p>
        </form>
      </div>
    </div>
  );
}

