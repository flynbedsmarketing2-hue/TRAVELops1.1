import Link from "next/link";
import { Card, CardContent } from "../components/ui/card";
import { buttonClassName } from "../components/ui/buttonStyles";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardContent className="space-y-6 p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">TravelOps</p>
          <h1 className="font-heading text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">
            Backoffice voyage, minimal et rapide
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Accede aux modules voyages, ventes et ops sans texte superflu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={buttonClassName({ variant: "primary", size: "lg" })}>
              Login
            </Link>
            <Link href="/dashboard" className={buttonClassName({ variant: "outline", size: "lg" })}>
              Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
