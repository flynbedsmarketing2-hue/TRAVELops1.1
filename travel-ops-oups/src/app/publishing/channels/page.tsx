"use client";

import AuthGuard from "../../../components/AuthGuard";
import PageHeader from "../../../components/PageHeader";
import { Card, CardContent } from "../../../components/ui/card";

export default function PublishingChannelsPage() {
  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Publishing"
          title="Channel Outputs (Scaffold)"
          subtitle="Placeholders for Flynbeds and Nouba Plus exports."
        />
        <Card>
          <CardContent className="pt-4 text-sm text-slate-600">
            Channel-specific payload builders will be implemented in Phase 2.
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
