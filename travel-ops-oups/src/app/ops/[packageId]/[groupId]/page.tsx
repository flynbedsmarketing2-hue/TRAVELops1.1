'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  PlaneTakeoff,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import AuthGuard from "../../../../components/AuthGuard";
import { usePackageStore } from "../../../../stores/usePackageStore";
import { useUserStore } from "../../../../stores/useUserStore";
import type { OpsGroup, OpsPaymentStep, OpsTimelineItem, Supplier } from "../../../../types";
import { daysUntil, groupAlerts, paymentStepStatus, supplierDeadlineStatus } from "../../../../lib/ops";

type TabKey = "overview" | "air" | "land" | "team";

const tabStorageKey = (packageId: string, groupId: string) =>
  `travelops:ops-tab:${packageId}:${groupId}`;

export default function OpsGroupPage() {
  const params = useParams<{ packageId: string; groupId: string }>();
  const packageId = params.packageId;
  const groupId = params.groupId;

  const { currentUser } = useUserStore();
  const canValidate = currentUser?.role === "administrator" || currentUser?.role === "travel_designer";

  const {
    packages,
    updateOpsGroupStatus,
    addSupplier,
    removeSupplier,
    addCostStep,
    updateCostStep,
    removeCostStep,
    addTimelineItem,
    updateTimelineItem,
    removeTimelineItem,
  } = usePackageStore();

  const pkg = packages.find((p) => p.id === packageId);
  const group = pkg?.opsProject?.groups.find((g) => g.id === groupId) as OpsGroup | undefined;

  const localKey = tabStorageKey(packageId, groupId);
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "overview";
    const stored = window.localStorage.getItem(localKey) as TabKey | null;
    return stored ?? "overview";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(localKey, tab);
  }, [localKey, tab]);

  const dday = daysUntil(group?.departureDate);
  const alerts = group ? groupAlerts(group) : { overdueCosts: 0, overdueSuppliers: 0 };
  const title = pkg && group ? `${pkg.general.productName} • ${group.flightLabel}` : "Ops group";

  if (!pkg || !group) {
    return (
      <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
        <div className="section-shell space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Groupe Ops introuvable.</p>
          <Link
            href="/ops"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour Ops
          </Link>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowRoles={["administrator", "travel_designer", "sales_agent", "viewer"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.08em] text-primary">Ops Manager</p>
            <h1 className="font-heading text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Départ: {group.departureDate || "—"}
              {dday !== null ? ` • J-${dday >= 0 ? dday : 0}` : ""} • Statut:{" "}
              <span className="font-semibold">{group.status}</span>
              {group.validationDate ? (
                <span className="text-slate-400 dark:text-slate-400">
                  {" "}
                  • validé le {group.validationDate.slice(0, 10)}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/ops"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour Ops
            </Link>

            {canValidate ? (
              group.status === "validated" ? (
                <button
                  onClick={() => updateOpsGroupStatus(pkg.id, group.id, "pending_validation")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100"
                  type="button"
                >
                  <Clock className="h-4 w-4 text-amber-700" />
                  Rouvrir
                </button>
              ) : (
                <button
                  onClick={() => updateOpsGroupStatus(pkg.id, group.id, "validated")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider
                </button>
              )
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
          <div className="space-y-4">
            <TabList tab={tab} setTab={setTab} />
            {tab === "overview" ? <OverviewTab group={group} alerts={alerts} /> : null}
            {tab === "air" ? <AirTab group={group} /> : null}
            {tab === "land" ? (
              <LandTab
                group={group}
                onAddSupplier={(s) => addSupplier(pkg.id, group.id, s)}
                onRemoveSupplier={(idx) => removeSupplier(pkg.id, group.id, idx)}
                onAddCost={(c) => addCostStep(pkg.id, group.id, c)}
                onUpdateCost={(idx, u) => updateCostStep(pkg.id, group.id, idx, u)}
                onRemoveCost={(idx) => removeCostStep(pkg.id, group.id, idx)}
              />
            ) : null}
            {tab === "team" ? (
              <TeamTab
                group={group}
                onAddTimeline={(t) => addTimelineItem(pkg.id, group.id, t)}
                onUpdateTimeline={(idx, u) => updateTimelineItem(pkg.id, group.id, idx, u)}
                onRemoveTimeline={(idx) => removeTimelineItem(pkg.id, group.id, idx)}
              />
            ) : null}
          </div>

          <aside className="space-y-3">
            <div className="card space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Alertes
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Retards paiements: <span className="font-semibold">{alerts.overdueCosts}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Deadlines fournisseurs: <span className="font-semibold">{alerts.overdueSuppliers}</span>
              </p>
            </div>
            <div className="card p-4 text-xs text-slate-500 dark:text-slate-300">
              Tab persistant: <span className="font-semibold">{tab}</span>
            </div>
          </aside>
        </div>
      </div>
    </AuthGuard>
  );
}

function TabList({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <ShieldCheck className="h-4 w-4" /> },
    { key: "air", label: "Air", icon: <PlaneTakeoff className="h-4 w-4" /> },
    { key: "land", label: "Land", icon: <WalletCards className="h-4 w-4" /> },
    { key: "team", label: "Team", icon: <Users className="h-4 w-4" /> },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            tab === t.key ? "border border-primary/30 bg-primary/10 text-primary" : "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          }`}
          type="button"
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({
  group,
  alerts,
}: {
  group: OpsGroup;
  alerts: { overdueCosts: number; overdueSuppliers: number };
}) {
  const dday = daysUntil(group.departureDate);
  return (
    <div className="section-shell space-y-3">
      <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Résumé</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Info label="Départ" value={group.departureDate || "—"} />
        <Info label="J-x" value={dday !== null ? `${dday}` : "—"} />
        <Info label="Statut" value={group.status} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Info label="Fournisseurs" value={`${group.suppliers.length}`} />
        <Info label="Étapes paiement" value={`${group.costs.length}`} />
      </div>
      {alerts.overdueCosts || alerts.overdueSuppliers ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Alertes: {alerts.overdueCosts} paiement(s) en retard, {alerts.overdueSuppliers} deadline(s) fournisseur(s)
          dépassée(s).
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200">
          Aucun retard détecté.
        </div>
      )}
    </div>
  );
}

function AirTab({ group }: { group: OpsGroup }) {
  return (
    <div className="section-shell space-y-2">
      <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Air</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {group.flightLabel}. Cette section est prête à être enrichie (PNR, billets, manifest, contraintes bagages,
        etc.).
      </p>
    </div>
  );
}

function LandTab({
  group,
  onAddSupplier,
  onRemoveSupplier,
  onAddCost,
  onUpdateCost,
  onRemoveCost,
}: {
  group: OpsGroup;
  onAddSupplier: (s: Supplier) => void;
  onRemoveSupplier: (idx: number) => void;
  onAddCost: (c: OpsPaymentStep) => void;
  onUpdateCost: (idx: number, u: Partial<OpsPaymentStep>) => void;
  onRemoveCost: (idx: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="section-shell space-y-3">
        <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Land</h2>
        <SupplierEditor suppliers={group.suppliers} onAdd={onAddSupplier} onRemove={onRemoveSupplier} />
      </div>
      <div className="section-shell space-y-3">
        <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Dépôts / Soldes</h3>
        <CostEditor costs={group.costs} onAdd={onAddCost} onUpdate={onUpdateCost} onRemove={onRemoveCost} />
      </div>
    </div>
  );
}

function TeamTab({
  group,
  onAddTimeline,
  onUpdateTimeline,
  onRemoveTimeline,
}: {
  group: OpsGroup;
  onAddTimeline: (t: OpsTimelineItem) => void;
  onUpdateTimeline: (idx: number, u: Partial<OpsTimelineItem>) => void;
  onRemoveTimeline: (idx: number) => void;
}) {
  return (
    <div className="section-shell space-y-3">
      <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline</h2>
      <TimelineEditor items={group.timeline} onAdd={onAddTimeline} onUpdate={onUpdateTimeline} onRemove={onRemoveTimeline} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function SupplierEditor({
  suppliers,
  onAdd,
  onRemove,
}: {
  suppliers: Supplier[];
  onAdd: (s: Supplier) => void;
  onRemove: (idx: number) => void;
}) {
  const [draft, setDraft] = useState<Supplier>({ name: "", contact: "", cost: 0, deadline: "" });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nom fournisseur"
          className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        />
        <input
          value={draft.deadline ?? ""}
          onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
          type="date"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        />
        <input
          value={draft.cost ?? 0}
          onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) || 0 })}
          type="number"
          className="w-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
          placeholder="Coût"
        />
        <button
          onClick={() => {
            if (!draft.name.trim()) return;
            onAdd(draft);
            setDraft({ name: "", contact: "", cost: 0, deadline: "" });
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          type="button"
        >
          Ajouter
        </button>
      </div>

      {suppliers.length ? (
        <div className="space-y-2">
          {suppliers.map((s, idx) => {
            const status = supplierDeadlineStatus(s);
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {s.deadline ? `Deadline ${s.deadline}` : "—"} • {s.cost ? `${s.cost} DZD` : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {status === "overdue" ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      En retard
                    </span>
                  ) : null}
                  <button onClick={() => onRemove(idx)} className="text-xs font-semibold text-red-600" type="button">
                    Suppr.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-300">Aucun fournisseur.</p>
      )}
    </div>
  );
}

function CostEditor({
  costs,
  onAdd,
  onUpdate,
  onRemove,
}: {
  costs: OpsPaymentStep[];
  onAdd: (c: OpsPaymentStep) => void;
  onUpdate: (idx: number, u: Partial<OpsPaymentStep>) => void;
  onRemove: (idx: number) => void;
}) {
  const [draft, setDraft] = useState<OpsPaymentStep>({ label: "Dépôt", amount: 0, dueDate: "", paid: false });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
          placeholder="Label"
        />
        <input
          type="number"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) || 0 })}
          className="w-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
          placeholder="Montant"
        />
        <input
          type="date"
          value={draft.dueDate ?? ""}
          onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        />
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200">
          <input
            type="checkbox"
            checked={draft.paid ?? false}
            onChange={(e) => setDraft({ ...draft, paid: e.target.checked })}
          />
          Payé
        </label>
        <button
          onClick={() => {
            if (!draft.label.trim()) return;
            onAdd(draft);
            setDraft({ label: "Dépôt", amount: 0, dueDate: "", paid: false });
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          type="button"
        >
          Ajouter
        </button>
      </div>

      {costs.length ? (
        <div className="space-y-2">
          {costs.map((c, idx) => {
            const status = paymentStepStatus(c);
            return (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {c.label} • {c.amount} DZD
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {c.dueDate ? `Échéance ${c.dueDate}` : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      status === "paid"
                        ? "bg-green-50 text-green-700"
                        : status === "overdue"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {status === "paid" ? "Payé" : status === "overdue" ? "En retard" : "À payer"}
                  </span>
                  <button
                    onClick={() => onUpdate(idx, { paid: !c.paid })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
                    type="button"
                  >
                    Toggle payé
                  </button>
                  <button onClick={() => onRemove(idx)} className="text-xs font-semibold text-red-600" type="button">
                    Suppr.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-300">Aucun paiement planifié.</p>
      )}
    </div>
  );
}

function TimelineEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: OpsTimelineItem[];
  onAdd: (t: OpsTimelineItem) => void;
  onUpdate: (idx: number, u: Partial<OpsTimelineItem>) => void;
  onRemove: (idx: number) => void;
}) {
  const [draft, setDraft] = useState<OpsTimelineItem>({
    title: "Étape",
    date: "",
    note: "",
    kind: "info",
  });

  const sorted = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => (a.item.date || "").localeCompare(b.item.date || ""));
  }, [items]);

  const kindValue = (draft.kind ?? "info") as NonNullable<OpsTimelineItem["kind"]>;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={kindValue}
          onChange={(e) =>
            setDraft({ ...draft, kind: e.target.value as NonNullable<OpsTimelineItem["kind"]> })
          }
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        >
          <option value="info">Info</option>
          <option value="deadline">Deadline</option>
          <option value="risk">Risque</option>
          <option value="done">Terminé</option>
        </select>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Titre"
          className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        />
        <input
          type="date"
          value={draft.date ?? ""}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        />
        <input
          value={draft.note ?? ""}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          placeholder="Note"
          className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
        />
        <button
          onClick={() => {
            if (!draft.title.trim()) return;
            onAdd(draft);
            setDraft({ title: "Étape", date: "", note: "", kind: "info" });
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          type="button"
        >
          Ajouter
        </button>
      </div>

      {sorted.length ? (
        <div className="space-y-2">
          {sorted.map(({ item, index }) => {
            const kind = item.kind ?? "info";
            const pill =
              kind === "done"
                ? "bg-green-50 text-green-700"
                : kind === "deadline"
                  ? "bg-amber-50 text-amber-700"
                  : kind === "risk"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-700";

            return (
              <div
                key={`${index}-${item.title}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>{kind}</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{item.date || ""}</p>
                  </div>
                  {item.note ? <p className="text-xs text-slate-600 dark:text-slate-300">{item.note}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdate(index, { kind: kind === "done" ? "info" : "done" })}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
                    type="button"
                  >
                    Toggle done
                  </button>
                  <button onClick={() => onRemove(index)} className="text-xs font-semibold text-red-600" type="button">
                    Suppr.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-300">Aucun élément timeline.</p>
      )}
    </div>
  );
}

