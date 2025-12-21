"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Copy, FileJson } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { apiFetch } from "../../lib/apiClient";
import type { TravelPackage } from "../../types";

export default function PublishingPage() {
  const { data: packages } = useSWR<TravelPackage[]>("/api/packages", apiFetch);
  const [selectedId, setSelectedId] = useState<string>("");
  const minPrice = (pkg: TravelPackage) => {
    const prices = pkg.pricing.map((p) => p.unitPrice).filter((value) => value > 0);
    return prices.length ? Math.min(...prices) : 0;
  };

  const selected = useMemo(
    () => packages?.find((pkg) => pkg.id === selectedId) ?? packages?.[0] ?? null,
    [packages, selectedId]
  );

  const contentPack = useMemo(() => {
    if (!selected) return null;
    return {
      id: selected.id,
      productName: selected.general.productName,
      productCode: selected.general.productCode,
      destination: selected.flights.destination,
      cities: selected.flights.cities,
      duration: selected.flights.flights.map((f) => f.duration).filter(Boolean)[0] ?? "",
      pricing: selected.pricing,
      included: selected.content.included,
      excluded: selected.content.excluded,
      highlights: selected.content.excursionsIncluded,
      itinerary: selected.itinerary.days,
      tags: selected.metadata?.segmentFit ?? "",
    };
  }, [selected]);

  const whatsappText = useMemo(() => {
    if (!selected) return "";
    return [
      `*${selected.general.productName}*`,
      `Code: ${selected.general.productCode}`,
      `Destination: ${selected.flights.destination}`,
      `Dates: ${selected.flights.flights.map((f) => f.departureDate).join(", ")}`,
      `Starting from: ${minPrice(selected)} DZD`,
      `Inclusions: ${selected.content.included.slice(0, 3).join(", ")}`,
    ].join("\n");
  }, [selected]);

  const emailSnippet = useMemo(() => {
    if (!selected) return "";
    return `Bonjour,\n\nVoici le contenu pour ${selected.general.productName} (${selected.general.productCode}).\nDestination: ${selected.flights.destination}\nDates: ${selected.flights.flights
      .map((f) => f.departureDate)
      .join(", ")}\nPrix a partir de: ${minPrice(selected)} DZD.\n\nMerci.`;
  }, [selected]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Publishing"
          title="Publishing Center"
          subtitle="Content packs and share snippets."
          actions={
            <Link href="/publishing/channels">
              <Button variant="outline">Channel outputs</Button>
            </Link>
          }
        />

        <Card>
          <CardContent className="space-y-3 pt-4">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Package</label>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {(packages ?? []).map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.general.productName} ({pkg.general.productCode})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {!selected ? (
          <Card>
            <CardContent className="pt-4 text-sm text-slate-600">No package selected.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FileJson className="h-4 w-4 text-primary" />
                  Content Pack JSON
                </div>
                <pre className="max-h-[320px] overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                  {JSON.stringify(contentPack, null, 2)}
                </pre>
                <Button variant="outline" onClick={() => copyText(JSON.stringify(contentPack, null, 2))}>
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div className="text-sm font-semibold text-slate-800">WhatsApp share</div>
                  <pre className="rounded-lg border border-slate-200 bg-white p-3 text-xs">{whatsappText}</pre>
                  <Button variant="outline" onClick={() => copyText(whatsappText)}>
                    <Copy className="h-4 w-4" />
                    Copy text
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div className="text-sm font-semibold text-slate-800">Email snippet</div>
                  <pre className="rounded-lg border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap">
                    {emailSnippet}
                  </pre>
                  <Button variant="outline" onClick={() => copyText(emailSnippet)}>
                    <Copy className="h-4 w-4" />
                    Copy email
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
