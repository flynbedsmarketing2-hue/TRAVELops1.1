'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import PageHeader from "../../../components/PageHeader";
import { buttonClassName } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { PackageEditor } from "../../../components/PackageEditor";
import { PackagePdfButtons } from "../../../components/PackagePdfButtons";
import { usePackageStore } from "../../../stores/usePackageStore";

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>();
  const packageId = params.id;
  const { packages } = usePackageStore();
  const pkg = packages.find((item) => item.id === packageId);

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer"]}>
      {!pkg ? (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Package introuvable. Vérifie l’id ou reviens à la liste.
            </p>
            <Link href="/packages" className={buttonClassName({ variant: "outline" })}>
              <PackageSearch className="h-4 w-4" />
              Retour
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <PageHeader
            eyebrow="Packages"
            title={pkg.general.productName || "Package"}
            subtitle={`${pkg.general.productCode || "—"} • ${pkg.flights.destination || "—"} • ${pkg.status}`}
            actions={
              <>
                <Link href="/packages" className={buttonClassName({ variant: "outline" })}>
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Link>
                <PackagePdfButtons travelPackage={pkg} />
              </>
            }
          />
          <PackageEditor mode="edit" initialPackage={pkg} />
        </div>
      )}
    </AuthGuard>
  );
}
