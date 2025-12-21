"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ClipboardCheck, Columns, Plus, Send } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { apiFetch } from "../../lib/apiClient";

type FactoryItem = {
  id: string;
  title: string;
  stage: "idea" | "research" | "brief" | "build" | "validation" | "published";
  brief?: Record<string, unknown> | null;
  research?: Record<string, unknown> | null;
  readinessIssues?: string[] | null;
};

type ApprovalRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  entityType: string;
  entityId: string;
  createdAt: string;
  decisions: Array<{ id: string; status: "approved" | "rejected"; comment?: string }>;
};

const STAGES: FactoryItem["stage"][] = [
  "idea",
  "research",
  "brief",
  "build",
  "validation",
  "published",
];

const LABELS: Record<FactoryItem["stage"], string> = {
  idea: "Idea",
  research: "Research",
  brief: "Brief",
  build: "Build",
  validation: "Validation",
  published: "Published",
};

const REQUIRED_BRIEF_FIELDS = [
  "productName",
  "targetSegment",
  "durationDays",
  "budgetPerPax",
  "heroDestination",
  "valueProps",
  "itineraryOutline",
  "suppliers",
  "pricingAssumptions",
];

export default function FactoryPage() {
  const { data: items, mutate } = useSWR<FactoryItem[]>("/api/factory-items", apiFetch);
  const { data: approvals, mutate: mutateApprovals } = useSWR<ApprovalRequest[]>("/api/approvals", apiFetch);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FactoryItem | null>(null);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<FactoryItem["stage"]>("idea");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const data = items ?? [];
    return STAGES.reduce((acc, s) => {
      acc[s] = data.filter((item) => item.stage === s);
      return acc;
    }, {} as Record<FactoryItem["stage"], FactoryItem[]>);
  }, [items]);

  const resetModal = () => {
    setEditing(null);
    setTitle("");
    setStage("idea");
    setBrief({});
    setError(null);
  };

  const openCreate = () => {
    resetModal();
    setOpen(true);
  };

  const openEdit = (item: FactoryItem) => {
    setEditing(item);
    setTitle(item.title);
    setStage(item.stage);
    setBrief((item.brief as Record<string, string>) ?? {});
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    const payload = {
      title: title.trim(),
      stage,
      brief,
    };
    try {
      if (editing) {
        await apiFetch(`/api/factory-items/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/factory-items", { method: "POST", body: JSON.stringify(payload) });
      }
      await mutate();
      setOpen(false);
      resetModal();
    } catch (err) {
      setError("Unable to save item");
    }
  };

  const moveStage = async (item: FactoryItem, next: FactoryItem["stage"]) => {
    setError(null);
    try {
      await apiFetch(`/api/factory-items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: next }),
      });
      await mutate();
    } catch (err: any) {
      setError("Brief not ready for validation");
    }
  };

  const submitForValidation = async (item: FactoryItem) => {
    setError(null);
    try {
      await apiFetch(`/api/factory-items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: "validation" }),
      });
      await apiFetch("/api/approvals", {
        method: "POST",
        body: JSON.stringify({ entityType: "FactoryItem", entityId: item.id }),
      });
      await mutate();
      await mutateApprovals();
    } catch (err: any) {
      setError("Brief not ready for validation");
    }
  };

  const decide = async (requestId: string, status: "approved" | "rejected") => {
    const comment = window.prompt("Comment (optional)", "") ?? undefined;
    await apiFetch(`/api/approvals/${requestId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status, comment }),
    });
    await mutateApprovals();
  };

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Factory"
          title="Product Factory Pipeline"
          subtitle="Idea to publish with gated approvals."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New item
            </Button>
          }
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-6">
          {STAGES.map((stageKey) => (
            <div key={stageKey} className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>{LABELS[stageKey]}</span>
                <span className="text-xs text-slate-400">{grouped[stageKey]?.length ?? 0}</span>
              </div>
              <div className="space-y-3">
                {(grouped[stageKey] ?? []).map((item) => (
                  <Card key={item.id} className="border border-slate-200">
                    <CardContent className="space-y-3 pt-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        {item.readinessIssues?.length ? (
                          <p className="text-xs text-amber-700">
                            {item.readinessIssues.length} brief issue(s)
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-600">Brief ready</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                        <select
                          value={item.stage}
                          onChange={(e) => moveStage(item, e.target.value as FactoryItem["stage"])}
                          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                        >
                          {STAGES.map((stageOption) => (
                            <option key={stageOption} value={stageOption}>
                              {LABELS[stageOption]}
                            </option>
                          ))}
                        </select>
                        {item.stage === "build" || item.stage === "brief" ? (
                          <Button variant="primary" size="sm" onClick={() => submitForValidation(item)}>
                            <Send className="h-3 w-3" />
                            Submit
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Pending approvals
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(approvals ?? []).filter((a) => a.status === "pending").length === 0 ? (
              <Card>
                <CardContent className="pt-4 text-sm text-slate-600">No pending approvals.</CardContent>
              </Card>
            ) : (
              (approvals ?? [])
                .filter((a) => a.status === "pending")
                .map((request) => (
                  <Card key={request.id}>
                    <CardContent className="space-y-3 pt-4">
                      <div className="text-sm font-semibold text-slate-800">
                        {request.entityType} #{request.entityId.slice(0, 6)}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => decide(request.id, "approved")}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => decide(request.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit factory item" : "New factory item"}>
        <div className="space-y-4">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Stage</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as FactoryItem["stage"])}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Columns className="h-4 w-4 text-primary" />
              Brief template
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {REQUIRED_BRIEF_FIELDS.map((field) => (
                <label key={field} className="space-y-1 text-xs font-semibold text-slate-600">
                  <span>{field}</span>
                  <input
                    value={brief[field] ?? ""}
                    onChange={(e) => setBrief({ ...brief, [field]: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

          <div className="flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AuthGuard>
  );
}
