"use client";

import AuthGuard from "../../../components/AuthGuard";
import PageHeader from "../../../components/PageHeader";
import { Card, CardContent } from "../../../components/ui/card";

export default function SupplierContractsPage() {
  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Suppliers"
          title="Contracts & Attachments (Scaffold)"
          subtitle="Versioned contracting files will be added in Phase 2."
        />
        <Card>
          <CardContent className="pt-4 text-sm text-slate-600">
            Contract attachment storage and versioning placeholder.
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
