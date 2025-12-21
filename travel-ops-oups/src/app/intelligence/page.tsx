"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Calendar, MapPin, Plus, ShieldCheck } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../lib/apiClient";

type VisaRule = {
  id: string;
  requirements: Record<string, unknown>;
  processingDays?: number | null;
  difficultyScore?: number | null;
  lastUpdated?: string | null;
};

type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  impactScore?: number | null;
};

type Destination = {
  id: string;
  country: string;
  city?: string | null;
  tags: string[];
  seasonality?: string | null;
  bestMonths: string[];
  segmentFit?: string | null;
  riskLevel?: string | null;
  notes?: string | null;
  visaRules: VisaRule[];
  events: Event[];
};

export default function IntelligencePage() {
  const { data: destinations, mutate } = useSWR<Destination[]>("/api/destinations", apiFetch);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    country: "",
    city: "",
    tags: "",
    seasonality: "",
    bestMonths: "",
    segmentFit: "",
    riskLevel: "",
    notes: "",
  });
  const [visaForm, setVisaForm] = useState({ requirements: "", processingDays: "", difficultyScore: "" });
  const [eventForm, setEventForm] = useState({ name: "", startDate: "", endDate: "", type: "", impactScore: "" });

  const selected = useMemo(
    () => destinations?.find((destination) => destination.id === selectedId) ?? destinations?.[0] ?? null,
    [destinations, selectedId]
  );

  const openCreate = () => {
    setForm({
      country: "",
      city: "",
      tags: "",
      seasonality: "",
      bestMonths: "",
      segmentFit: "",
      riskLevel: "",
      notes: "",
    });
    setOpen(true);
  };

  const createDestination = async () => {
    await apiFetch("/api/destinations", {
      method: "POST",
      body: JSON.stringify({
        country: form.country.trim(),
        city: form.city.trim() || undefined,
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        seasonality: form.seasonality.trim() || undefined,
        bestMonths: form.bestMonths
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        segmentFit: form.segmentFit.trim() || undefined,
        riskLevel: form.riskLevel.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }),
    });
    await mutate();
    setOpen(false);
  };

  const addVisaRule = async () => {
    if (!selected) return;
    await apiFetch(`/api/destinations/${selected.id}/visa-rules`, {
      method: "POST",
      body: JSON.stringify({
        requirements: visaForm.requirements ? { checklist: visaForm.requirements.split(",").map((x) => x.trim()) } : {},
        processingDays: visaForm.processingDays ? Number(visaForm.processingDays) : undefined,
        difficultyScore: visaForm.difficultyScore ? Number(visaForm.difficultyScore) : undefined,
        lastUpdated: new Date().toISOString(),
      }),
    });
    setVisaForm({ requirements: "", processingDays: "", difficultyScore: "" });
    await mutate();
  };

  const addEvent = async () => {
    if (!selected) return;
    await apiFetch(`/api/destinations/${selected.id}/events`, {
      method: "POST",
      body: JSON.stringify({
        name: eventForm.name,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        type: eventForm.type,
        impactScore: eventForm.impactScore ? Number(eventForm.impactScore) : undefined,
      }),
    });
    setEventForm({ name: "", startDate: "", endDate: "", type: "", impactScore: "" });
    await mutate();
  };

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Intelligence"
          title="Destination Intelligence"
          subtitle="Countries, visas, events, and risk signals."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New destination
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <Card>
            <CardContent className="space-y-2 pt-4">
              {(destinations ?? []).length === 0 ? (
                <p className="text-sm text-slate-600">No destinations yet.</p>
              ) : (
                (destinations ?? []).map((destination) => (
                  <button
                    key={destination.id}
                    onClick={() => setSelectedId(destination.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold ${
                      destination.id === selected?.id
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {destination.country} {destination.city ? `- ${destination.city}` : ""}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selected ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <MapPin className="h-4 w-4 text-primary" />
                    {selected.country} {selected.city ? `- ${selected.city}` : ""}
                  </div>
                  <p className="text-sm text-slate-600">
                    Tags: {selected.tags.length ? selected.tags.join(", ") : "None"}
                  </p>
                  <p className="text-sm text-slate-600">Seasonality: {selected.seasonality || "-"}</p>
                  <p className="text-sm text-slate-600">Best months: {selected.bestMonths.join(", ") || "-"}</p>
                  <p className="text-sm text-slate-600">Segment fit: {selected.segmentFit || "-"}</p>
                  <p className="text-sm text-slate-600">Risk: {selected.riskLevel || "-"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Visa requirements
                  </div>
                  <div className="space-y-2">
                    {(selected.visaRules ?? []).map((visa) => (
                      <div key={visa.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <p className="font-semibold">Checklist</p>
                        <p className="text-xs text-slate-600">
                          {Array.isArray((visa.requirements as any)?.checklist)
                            ? ((visa.requirements as any).checklist as string[]).join(", ")
                            : "None"}
                        </p>
                        <p className="text-xs text-slate-600">
                          Processing: {visa.processingDays ?? "-"} days | Difficulty: {visa.difficultyScore ?? "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={visaForm.requirements}
                      onChange={(e) => setVisaForm({ ...visaForm, requirements: e.target.value })}
                      placeholder="Checklist (comma)"
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      value={visaForm.processingDays}
                      onChange={(e) => setVisaForm({ ...visaForm, processingDays: e.target.value })}
                      placeholder="Processing days"
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      value={visaForm.difficultyScore}
                      onChange={(e) => setVisaForm({ ...visaForm, difficultyScore: e.target.value })}
                      placeholder="Difficulty"
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                  <Button variant="outline" onClick={addVisaRule}>
                    Add visa rule
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Calendar className="h-4 w-4 text-primary" />
                    Events
                  </div>
                  <div className="space-y-2">
                    {(selected.events ?? []).map((event) => (
                      <div key={event.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <p className="font-semibold">{event.name}</p>
                        <p className="text-xs text-slate-600">
                          {event.startDate.slice(0, 10)} - {event.endDate.slice(0, 10)} | {event.type}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      placeholder="Event name"
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                      placeholder="Type"
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                  <Button variant="outline" onClick={addEvent}>
                    Add event
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4 text-sm text-slate-600">Select a destination.</CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New destination">
        <div className="space-y-3">
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="Country"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="City"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma)"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.bestMonths}
            onChange={(e) => setForm({ ...form, bestMonths: e.target.value })}
            placeholder="Best months (comma)"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.seasonality}
            onChange={(e) => setForm({ ...form, seasonality: e.target.value })}
            placeholder="Seasonality"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.segmentFit}
            onChange={(e) => setForm({ ...form, segmentFit: e.target.value })}
            placeholder="Segment fit"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.riskLevel}
            onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
            placeholder="Risk level"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={createDestination}>Create</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AuthGuard>
  );
}
