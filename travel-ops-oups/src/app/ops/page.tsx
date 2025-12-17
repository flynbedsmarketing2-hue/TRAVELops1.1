'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Search, ShieldCheck, Telescope } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button, buttonClassName } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cn } from "../../components/ui/cn";
import { Input } from "../../components/ui/input";
import { Table, TBody, TD, THead, TH, TR } from "../../components/ui/table";
import { daysUntil, groupAlerts } from "../../lib/ops";
import { usePackageStore } from "../../stores/usePackageStore";
import { useUserStore } from "../../stores/useUserStore";
import type { OpsGroup, OpsStatus, TravelPackage } from "../../types";

type StatusFilter = "all" | OpsStatus;
type JxFilter = "all" | 7 | 15 | 30;

type OpsRow = {
  pkg: TravelPackage;
  group: OpsGroup;
  dday: number | null;
  alerts: ReturnType<typeof groupAlerts>;
};

function isWithinJx(dday: number | null, filter: JxFilter) {
  if (filter === "all") return true;
  if (dday === null) return false;
  return dday >= 0 && dday <= filter;
}

function StatusPill({ status }: { status: OpsStatus }) {
  const styles =
    status === "validated"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", styles)}>
      {status === "validated" ? "Validé" : "À valider"}
    </span>
  );
}

function ChipButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-sm font-semibold transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
      )}
    >
      {children}
    </button>
  );
}

export default function OpsPage() {
  const { currentUser } = useUserStore();
  const { packages, updateOpsGroupStatus } = usePackageStore();

  const canSeeAll = currentUser?.role === "administrator" || currentUser?.role === "travel_designer";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [jx, setJx] = useState<JxFilter>(30);

  const rows = useMemo<OpsRow[]>(() => {
    const q = search.trim().toLowerCase();
    const flat: OpsRow[] = packages.flatMap((pkg) => {
      const groups = pkg.opsProject?.groups ?? [];
      return groups.map((group) => ({
        pkg,
        group,
        dday: daysUntil(group.departureDate),
        alerts: groupAlerts(group),
      }));
    });

    return flat
      .filter(({ group }) => (canSeeAll ? true : group.status === "validated"))
      .filter(({ group }) => (statusFilter === "all" ? true : group.status === statusFilter))
      .filter(({ dday }) => isWithinJx(dday, jx))
      .filter(({ pkg, group }) => {
        if (!q) return true;
        const haystack = `${pkg.general.productName} ${pkg.general.productCode} ${pkg.flights.destination} ${group.flightLabel}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const aDate = a.group.departureDate ? new Date(a.group.departureDate).getTime() : Infinity;
        const bDate = b.group.departureDate ? new Date(b.group.departureDate).getTime() : Infinity;
        return aDate - bDate;
      });
  }, [canSeeAll, jx, packages, search, statusFilter]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const validated = rows.filter((r) => r.group.status === "validated").length;
    const pending = rows.filter((r) => r.group.status === "pending_validation").length;
    const soon = rows.filter((r) => r.dday !== null && r.dday >= 0 && r.dday <= 7).length;
    const overdue = rows.reduce((acc, r) => acc + r.alerts.overdueCosts + r.alerts.overdueSuppliers, 0);
    return { total, validated, pending, soon, overdue };
  }, [rows]);

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Ops"
          title="Opérations"
          subtitle={
            canSeeAll
              ? "Suivi des groupes par départ, validation et alertes fournisseurs/coûts."
              : "Vue limitée aux groupes validés."
          }
          actions={
            <Link href="/packages" className={buttonClassName({ variant: "outline" })}>
              Gérer les packages
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Groupes" value={kpis.total} icon={<Telescope className="h-5 w-5" />} />
          <Kpi label="Validés" value={kpis.validated} icon={<ShieldCheck className="h-5 w-5" />} />
          <Kpi label="À valider" value={kpis.pending} icon={<Clock className="h-5 w-5" />} />
          <Kpi label="Départs < 7j" value={kpis.soon} icon={<CheckCircle2 className="h-5 w-5" />} />
          <Kpi label="Alertes" value={kpis.overdue} icon={<Clock className="h-5 w-5" />} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher (package, code, destination, vol...)"
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ChipButton active={jx === "all"} onClick={() => setJx("all")}>
                  Tous
                </ChipButton>
                <ChipButton active={jx === 7} onClick={() => setJx(7)}>
                  J-7
                </ChipButton>
                <ChipButton active={jx === 15} onClick={() => setJx(15)}>
                  J-15
                </ChipButton>
                <ChipButton active={jx === 30} onClick={() => setJx(30)}>
                  J-30
                </ChipButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ChipButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                Tous
              </ChipButton>
              <ChipButton
                active={statusFilter === "pending_validation"}
                onClick={() => setStatusFilter("pending_validation")}
              >
                À valider
              </ChipButton>
              <ChipButton active={statusFilter === "validated"} onClick={() => setStatusFilter("validated")}>
                Validés
              </ChipButton>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">{rows.length} groupe(s) affiché(s)</p>
          </div>

          {rows.length === 0 ? (
            <div className="section-shell">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Aucun groupe à afficher. Créez un package avec des vols pour générer un projet Ops.
              </p>
              <Link href="/packages/new" className={buttonClassName({ variant: "primary" })}>
                Créer un package
              </Link>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Package</TH>
                  <TH>Vol / Groupe</TH>
                  <TH>Départ</TH>
                  <TH>Statut</TH>
                  <TH>Alertes</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map(({ pkg, group, dday, alerts }) => {
                  const canValidate = canSeeAll;
                  const hasAlerts = alerts.overdueCosts + alerts.overdueSuppliers > 0;
                  return (
                    <TR key={`${pkg.id}:${group.id}`}>
                      <TD className="min-w-[220px]">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {pkg.general.productName || "Sans nom"}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                            {pkg.general.productCode} • {pkg.flights.destination || "—"}
                          </p>
                        </div>
                      </TD>
                      <TD className="min-w-[220px]">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{group.flightLabel}</p>
                      </TD>
                      <TD className="min-w-[160px]">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {group.departureDate ? group.departureDate.slice(0, 10) : "—"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {dday === null ? "J-—" : dday >= 0 ? `J-${dday}` : "Déjà parti"}
                        </p>
                      </TD>
                      <TD>
                        <StatusPill status={group.status} />
                      </TD>
                      <TD>
                        {hasAlerts ? (
                          <div className="space-y-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
                            {alerts.overdueSuppliers ? <p>Fournisseurs en retard: {alerts.overdueSuppliers}</p> : null}
                            {alerts.overdueCosts ? <p>Paiements en retard: {alerts.overdueCosts}</p> : null}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-300">Aucune</span>
                        )}
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/ops/${pkg.id}/${group.id}`}
                            className={buttonClassName({ variant: "outline", size: "sm" })}
                          >
                            Ouvrir
                          </Link>
                          {canValidate ? (
                            group.status === "validated" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateOpsGroupStatus(pkg.id, group.id, "pending_validation")}
                              >
                                Rouvrir
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => updateOpsGroupStatus(pkg.id, group.id, "validated")}
                              >
                                Valider
                              </Button>
                            )
                          ) : null}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

function Kpi({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="font-heading text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

