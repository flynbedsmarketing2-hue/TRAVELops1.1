"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { CalendarCheck, ClipboardList, Plus } from "lucide-react";
import AuthGuard from "../../../components/AuthGuard";
import PageHeader from "../../../components/PageHeader";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { apiFetch } from "../../../lib/apiClient";

type TaskInstance = {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  assigneeId?: string | null;
  notes?: string | null;
};

type User = { id: string; username: string };
type Departure = { id: string; flightLabel: string };
type TaskTemplate = { id: string; name: string; offsetDays: number; productType?: string | null };

export default function OpsTasksPage() {
  const { data: tasks, mutate } = useSWR<TaskInstance[]>("/api/tasks", apiFetch);
  const { data: users } = useSWR<User[]>("/api/users", apiFetch);
  const { data: departures } = useSWR<Departure[]>("/api/departures", apiFetch);
  const { data: templates, mutate: mutateTemplates } = useSWR<TaskTemplate[]>("/api/task-templates", apiFetch);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskInstance["status"]>("all");
  const [draft, setDraft] = useState({ title: "", dueDate: "", departureId: "" });
  const [templateDraft, setTemplateDraft] = useState({ name: "", offsetDays: "", productType: "" });

  const filtered = useMemo(() => {
    const data = tasks ?? [];
    return statusFilter === "all" ? data : data.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  const addTask = async () => {
    if (!draft.title.trim() || !draft.dueDate || !draft.departureId) return;
    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        departureId: draft.departureId,
        title: draft.title.trim(),
        dueDate: draft.dueDate,
      }),
    });
    setDraft({ title: "", dueDate: "", departureId: "" });
    await mutate();
  };

  const updateStatus = async (taskId: string, status: TaskInstance["status"]) => {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await mutate();
  };

  const assign = async (taskId: string, assigneeId: string) => {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    });
    await mutate();
  };

  const addTemplate = async () => {
    if (!templateDraft.name.trim()) return;
    await apiFetch("/api/task-templates", {
      method: "POST",
      body: JSON.stringify({
        name: templateDraft.name,
        offsetDays: Number(templateDraft.offsetDays) || 0,
        productType: templateDraft.productType || undefined,
      }),
    });
    setTemplateDraft({ name: "", offsetDays: "", productType: "" });
    await mutateTemplates();
  };

  const generateTasks = async (departureId: string) => {
    await apiFetch("/api/tasks/generate", {
      method: "POST",
      body: JSON.stringify({ departureId }),
    });
    await mutate();
  };

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ops"
          title="Task Tracker"
          subtitle="J-x tasks with due dates and assignments."
        />

        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 pt-4">
            {(["all", "pending", "in_progress", "done", "blocked"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  statusFilter === key ? "border-primary/30 bg-primary/10 text-primary" : "border-slate-200 text-slate-600"
                }`}
              >
                {key}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Plus className="h-4 w-4 text-primary" />
              New task
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr,1fr,160px,auto]">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Task title"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={draft.departureId}
                onChange={(e) => setDraft({ ...draft, departureId: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select departure</option>
                {(departures ?? []).map((departure) => (
                  <option key={departure.id} value={departure.id}>
                    {departure.flightLabel}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <Button onClick={addTask}>Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ClipboardList className="h-4 w-4 text-primary" />
              Task templates
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr,120px,1fr,auto]">
              <input
                value={templateDraft.name}
                onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })}
                placeholder="Template name"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={templateDraft.offsetDays}
                onChange={(e) => setTemplateDraft({ ...templateDraft, offsetDays: e.target.value })}
                placeholder="J-x"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={templateDraft.productType}
                onChange={(e) => setTemplateDraft({ ...templateDraft, productType: e.target.value })}
                placeholder="Product type"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <Button variant="outline" onClick={addTemplate}>
                Add template
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(templates ?? []).map((template) => (
                <span
                  key={template.id}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {template.name} (J-{template.offsetDays})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Generate tasks for departure
            </div>
            <div className="flex flex-wrap gap-2">
              {(departures ?? []).map((departure) => (
                <Button key={departure.id} variant="outline" onClick={() => generateTasks(departure.id)}>
                  {departure.flightLabel}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {filtered.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    {task.title}
                  </div>
                  <p className="text-xs text-slate-500">
                    Due: {task.dueDate.slice(0, 10)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value as TaskInstance["status"])}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="pending">pending</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                    <option value="blocked">blocked</option>
                  </select>
                  <select
                    value={task.assigneeId ?? ""}
                    onChange={(e) => assign(task.id, e.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {(users ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                  <CalendarCheck className="h-4 w-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
