'use client';

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Plane } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { buttonClassName } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { usePackageStore } from "../../stores/usePackageStore";
import { useUserStore } from "../../stores/useUserStore";

export default function VoyagesPage() {
  const { packages } = usePackageStore();
  const { currentUser } = useUserStore();

  const published = packages.filter((pkg) => pkg.status === "published");
  const canBook = currentUser?.role === "sales_agent" || currentUser?.role === "administrator";

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Catalogue"
          title="Voyages publies"
          subtitle="Liste interne des offres actives."
          actions={
            <Link href="/sales" className={buttonClassName({ variant: "outline" })}>
              Aller aux ventes
            </Link>
          }
        />

        {published.length === 0 ? (
          <div className="section-shell">
            <p className="text-sm text-slate-600 dark:text-slate-300">Aucun package publie pour le moment.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {published.map((pkg) => {
              const image = pkg.general.imageUrl;
              return (
                <Card key={pkg.id} className="overflow-hidden">
                  <div className="relative h-40 bg-slate-100 dark:bg-slate-900">
                    {image ? (
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 via-slate-100 to-slate-200 dark:from-primary/20 dark:via-slate-950/60 dark:to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{pkg.general.productName}</p>
                        <p className="truncate text-xs text-white/80">{pkg.flights.destination || "-"}</p>
                      </div>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        Stock {pkg.general.stock}
                      </span>
                    </div>
                  </div>

                  <CardContent className="space-y-4 pt-5">
                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                      <p className="line-clamp-2">
                        Villes:{" "}
                        <span className="font-semibold">
                          {pkg.flights.cities.length ? pkg.flights.cities.join(", ") : "A definir"}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">Code: {pkg.general.productCode || "-"}</p>
                    </div>

                    <Link href="/sales" className={buttonClassName({ variant: "primary" })}>
                      <Plane className="h-4 w-4" />
                      {canBook ? "Reserver" : "Demander"}
                    </Link>
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
