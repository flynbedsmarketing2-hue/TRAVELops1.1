"use client";

import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export default function AnalyticsPage() {
  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Analytics Dashboard (Scaffold)"
          subtitle="Charts and KPIs will be wired in Phase 2."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-4 text-sm text-slate-600">Revenue by product (placeholder).</CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-sm text-slate-600">Pipeline velocity (placeholder).</CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-sm text-slate-600">Supplier SLA health (placeholder).</CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-sm text-slate-600">Booking conversion (placeholder).</CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
