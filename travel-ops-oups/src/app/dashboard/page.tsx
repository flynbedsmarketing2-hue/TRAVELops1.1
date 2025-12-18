'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Package2,
  PlaneTakeoff,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { cn } from "../../components/ui/cn";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { buttonClassName } from "../../components/ui/button";
import { useBookingStore } from "../../stores/useBookingStore";
import { usePackageStore } from "../../stores/usePackageStore";
import { useUserStore } from "../../stores/useUserStore";

const isSoon = (iso: string | undefined, days = 7) => {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(iso);
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days;
};

export default function DashboardPage() {
  const { currentUser } = useUserStore();
  const { packages } = usePackageStore();
  const { bookings } = useBookingStore();

  const publishedPkgs = packages.filter((pkg) => pkg.status === "published");
  const draftPkgs = packages.filter((pkg) => pkg.status === "draft");
  const published = publishedPkgs.length;
  const draft = draftPkgs.length;
  const lowStock = packages.filter((pkg) => pkg.general.stock <= 5);

  const pendingOps = packages.flatMap((pkg) =>
    pkg.opsProject ? pkg.opsProject.groups.filter((g) => g.status === "pending_validation") : []
  );

  const unpaidBookings = bookings.filter((b) => !b.payment.isFullyPaid && b.payment.totalPrice > 0);
  const optionExpiring = bookings.filter((b) => b.bookingType === "En option" && isSoon(b.reservedUntil ?? "", 3));

  const upcomingDepartures = packages
    .map((pkg) => {
      const dates = pkg.flights.flights.map((f) => f.departureDate).filter(Boolean).sort();
      return dates.length ? { pkg, nextDate: dates[0] } : null;
    })
    .filter(Boolean)
    .slice(0, 5) as { pkg: (typeof packages)[number]; nextDate: string }[];

  const totalStock = packages.reduce((sum, pkg) => sum + (pkg.general.stock || 0), 0);
  const bookedPaxPerPackage = (pkgId: string) =>
    bookings.filter((b) => b.packageId === pkgId).reduce((sum, b) => sum + b.paxTotal, 0);

  const alerts: { label: string; level: "info" | "warn" }[] = [];
  lowStock.forEach((pkg) =>
    alerts.push({
      label: `Stock bas: ${pkg.general.productName} (${pkg.general.stock} pax)`,
      level: "warn",
    })
  );
  optionExpiring.forEach((b) =>
    alerts.push({
      label: `Option a confirmer: booking ${b.id.slice(0, 6)} (package ${b.packageId})`,
      level: "warn",
    })
  );
  pendingOps.forEach((g) =>
    alerts.push({
      label: `Ops a valider: ${g.flightLabel}`,
      level: "info",
    })
  );

  const todos: string[] = [];
  if (pendingOps.length) todos.push(`${pendingOps.length} groupe(s) ops a valider`);
  if (unpaidBookings.length) todos.push(`${unpaidBookings.length} paiement(s) incomplets`);
  if (optionExpiring.length) todos.push(`${optionExpiring.length} option(s) a confirmer`);
  if (!todos.length) todos.push("Rien a traiter.");

  const role = currentUser?.role;
  const roleTag =
    role === "administrator"
      ? "admin"
      : role === "travel_designer"
        ? "designer"
        : role === "sales_agent"
          ? "sales"
          : "viewer";

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={`Dashboard - ${roleTag}`}
          title={`Bonjour ${currentUser?.username ?? "invite"}`}
          subtitle="Vue rapide des packages, ventes et ops."
          actions={
            <>
              <Link href="/packages/new" className={buttonClassName({ variant: "primary" })}>
                Nouveau package
              </Link>
              <Link href="/sales" className={buttonClassName({ variant: "outline" })}>
                Ventes
              </Link>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Packages publies" value={published} icon={<PlaneTakeoff className="h-5 w-5" />} />
          <KpiCard label="Packages brouillon" value={draft} icon={<Package2 className="h-5 w-5" />} />
          <KpiCard label="Reservations" value={bookings.length} icon={<ShoppingBag className="h-5 w-5" />} />
          <KpiCard label="Stock total (pax)" value={totalStock} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                A faire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {todos.map((todo, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{todo}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Aucune alerte.</p>
              ) : (
                alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                      alert.level === "warn"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200"
                    )}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{alert.label}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock3 className="h-4 w-4" />
                </span>
                Departs a venir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingDepartures.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Aucun depart planifie.</p>
              ) : (
                upcomingDepartures.map(({ pkg, nextDate }) => (
                  <div
                    key={pkg.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-sm dark:border-slate-800/70 dark:bg-slate-950/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{pkg.general.productName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                        {pkg.flights.destination} - {nextDate}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      Stock {pkg.general.stock} | Reserve {bookedPaxPerPackage(pkg.id)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activite recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentBookings.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Aucune reservation.</p>
              ) : (
                recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-sm dark:border-slate-800/70 dark:bg-slate-950/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        Booking {b.id.slice(0, 6)} - {b.bookingType}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                        Pax {b.paxTotal} | Paiement {b.payment.paidAmount}/{b.payment.totalPrice}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-300">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
