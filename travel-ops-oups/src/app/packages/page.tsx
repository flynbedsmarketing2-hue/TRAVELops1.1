'use client';

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Copy, Download, Plus, Search, Trash2, Upload } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button, buttonClassName } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../components/ui/cn";
import { Input } from "../../components/ui/input";
import { usePackageStore } from "../../stores/usePackageStore";
import { useUserStore } from "../../stores/useUserStore";
import type { TravelPackage } from "../../types";

type StatusFilter = "all" | "published" | "draft";
type SortKey = "recent" | "priceAsc" | "priceDesc" | "stockDesc";

function minPrice(pkg: TravelPackage): number {
  return pkg.pricing.reduce((acc, p) => (p.unitPrice > 0 ? Math.min(acc, p.unitPrice) : acc), Infinity);
}

function avgCommission(pkg: TravelPackage): number {
  if (!pkg.pricing.length) return 0;
  return pkg.pricing.reduce((sum, p) => sum + (p.commission ?? 0), 0) / pkg.pricing.length;
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n) || n === Infinity) return "-";
  return `${Math.round(n)} DZD`;
}

function asPackageArray(value: unknown): TravelPackage[] | null {
  if (!Array.isArray(value)) return null;
  return value as TravelPackage[];
}

function StatusPill({ status }: { status: TravelPackage["status"] }) {
  const styles =
    status === "published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", styles)}>
      {status === "published" ? "Publie" : "Brouillon"}
    </span>
  );
}

function ChipButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
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

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-heading text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function PackagesPage() {
  const { packages, duplicatePackage, deletePackage, importPackages, exportPackages } = usePackageStore();
  const { currentUser } = useUserStore();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const canEdit = currentUser?.role === "administrator" || currentUser?.role === "travel_designer";

  const stats = useMemo(() => {
    const total = packages.length;
    const published = packages.filter((p) => p.status === "published").length;
    const draft = packages.filter((p) => p.status === "draft").length;
    return { total, published, draft };
  }, [packages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages
      .filter((pkg) => (statusFilter === "all" ? true : pkg.status === statusFilter))
      .filter((pkg) => {
        if (!q) return true;
        const haystack = `${pkg.general.productName} ${pkg.general.productCode} ${pkg.flights.destination} ${pkg.general.responsible} ${pkg.flights.cities.join(" ")}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        if (sort === "recent") return new Date(b.general.creationDate).getTime() - new Date(a.general.creationDate).getTime();
        if (sort === "priceAsc") return minPrice(a) - minPrice(b);
        if (sort === "priceDesc") return minPrice(b) - minPrice(a);
        if (sort === "stockDesc") return b.general.stock - a.general.stock;
        return 0;
      });
  }, [packages, search, sort, statusFilter]);

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Packages"
          title="Gestion des offres"
          subtitle="Filtres rapides, import/export JSON, creation en local."
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  const data = exportPackages();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `travelops-packages-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>

              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    const parsed: unknown = JSON.parse(text);
                    const imported = asPackageArray(parsed);
                    if (!imported) {
                      window.alert("JSON invalide: tableau attendu.");
                      return;
                    }
                    const mode = window.confirm("Remplacer les packages existants ? (OK = replace, Annuler = merge)")
                      ? "replace"
                      : "merge";
                    const count = importPackages(imported, mode);
                    window.alert(`Import termine : ${count} package(s).`);
                  } catch {
                    window.alert("JSON invalide.");
                  } finally {
                    e.currentTarget.value = "";
                  }
                }}
              />

              {canEdit ? (
                <Link href="/packages/new" className={buttonClassName({ variant: "primary" })}>
                  <Plus className="h-4 w-4" />
                  Creer
                </Link>
              ) : null}
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Total" value={stats.total} />
          <Kpi label="Publies" value={stats.published} />
          <Kpi label="Brouillons" value={stats.draft} />
        </div>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="grid gap-3 lg:grid-cols-[1fr,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un package"
                  className="pl-10"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm shadow-black/5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
              >
                <option value="recent">Recents</option>
                <option value="priceAsc">Prix min +</option>
                <option value="priceDesc">Prix min -</option>
                <option value="stockDesc">Stock -</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ChipButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                Tous
              </ChipButton>
              <ChipButton active={statusFilter === "published"} onClick={() => setStatusFilter("published")}>
                Publies
              </ChipButton>
              <ChipButton active={statusFilter === "draft"} onClick={() => setStatusFilter("draft")}>
                Brouillons
              </ChipButton>
            </div>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <div className="section-shell">
            <p className="text-sm text-slate-600 dark:text-slate-300">Aucun package selon ces filtres.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((pkg) => {
              const price = minPrice(pkg);
              const commission = avgCommission(pkg);
              const image = pkg.general.imageUrl;
              return (
                <Card key={pkg.id} className="overflow-hidden">
                  <div className="relative h-36 bg-slate-100 dark:bg-slate-900">
                    {image ? (
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/15 via-slate-100 to-slate-200 dark:from-primary/15 dark:via-slate-950/60 dark:to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{pkg.general.productName || "Sans nom"}</p>
                        <p className="truncate text-xs text-white/80">
                          {pkg.general.productCode || "-"} - {pkg.flights.destination || "-"}
                        </p>
                      </div>
                      <StatusPill status={pkg.status} />
                    </div>
                  </div>

                  <CardContent className="space-y-4 pt-5">
                    <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Stock
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{pkg.general.stock} pax</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Prix min
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(price)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Commission
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(commission)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/packages/${pkg.id}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
                        Ouvrir
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const copyOps = window.confirm("Dupliquer avec les ops existants ? (OK = copier, Annuler = regenerer)");
                          duplicatePackage(pkg.id, { copyOps });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Dupliquer
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (!window.confirm("Supprimer ce package ?")) return;
                          deletePackage(pkg.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
