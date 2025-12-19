'use client';

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Hotel,
  Package as PackageIcon,
  WalletCards,
  X,
} from "lucide-react";
import type { Booking, BookingRoom, TravelPackage, RoomOccupant } from "../types";
import { computeTotals, paymentStatus, formatMoney } from "../lib/booking";

type Step = "package" | "rooming" | "uploads" | "payment" | "confirm";

export type BookingDraft = Omit<Booking, "id" | "createdAt">;

type Props = {
  open: boolean;
  packages: TravelPackage[];
  draft: BookingDraft;
  setDraft: (next: BookingDraft) => void;
  editing: boolean;
  remainingStock: number;
  computeReservedUntil: () => string;
  onClose: () => void;
  onSubmit: () => void;
};

export default function BookingWizardModal({
  open,
  packages,
  draft,
  setDraft,
  editing,
  remainingStock,
  computeReservedUntil,
  onClose,
  onSubmit,
}: Props) {
  const [step, setStep] = useState<Step>("package");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("package");
    setError(null);
  }, [open]);

  const pkg = useMemo(
    () => packages.find((p) => p.id === draft.packageId) ?? null,
    [draft.packageId, packages]
  );

  const totals = useMemo(
    () => (pkg ? computeTotals(pkg, draft.rooms) : null),
    [pkg, draft.rooms]
  );

  useEffect(() => {
    if (!pkg || !totals) return;
    if (draft.payment.totalPrice > 0) return;
    setDraft({
      ...draft,
      payment: {
        ...draft.payment,
        totalPrice: totals.total,
        isFullyPaid: draft.payment.paidAmount >= totals.total,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg?.id, totals?.total]);

  const stockLow = remainingStock <= 5;
  const stockExceeded = draft.paxTotal > remainingStock;

  const canGoNext = () => {
    if (step === "package") return Boolean(draft.packageId);
    if (step === "rooming") return draft.paxTotal > 0 && !stockExceeded;
    if (step === "payment") return draft.payment.totalPrice >= 0;
    return true;
  };

  const nextStep = () => {
    setError(null);
    if (!canGoNext()) {
      setError("Merci de compléter cette étape avant de continuer.");
      return;
    }
    const order: Step[] = ["package", "rooming", "uploads", "payment", "confirm"];
    const idx = order.indexOf(step);
    setStep(order[Math.min(idx + 1, order.length - 1)]);
  };

  const prevStep = () => {
    setError(null);
    const order: Step[] = ["package", "rooming", "uploads", "payment", "confirm"];
    const idx = order.indexOf(step);
    setStep(order[Math.max(idx - 1, 0)]);
  };

  const setRooms = (rooms: BookingRoom[]) => {
    const paxTotal = rooms.reduce((sum, room) => sum + room.occupants.length, 0);
    setDraft({ ...draft, rooms, paxTotal });
  };

  const handleFiles = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "passportScans" | "requiredDocuments" | "paymentProofUrl"
  ) => {
    const files = e.target.files;
    if (!files?.length) return;
    const toBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    const results = await Promise.all(Array.from(files).map(toBase64));
    if (key === "paymentProofUrl") {
      setDraft({
        ...draft,
        uploads: { ...draft.uploads, paymentProofUrl: results[0] },
      });
    } else {
      setDraft({
        ...draft,
        uploads: { ...draft.uploads, [key]: results },
      });
    }
    e.currentTarget.value = "";
  };

  const recomputePrice = () => {
    if (!pkg || !totals) return;
    setDraft({
      ...draft,
      payment: {
        ...draft.payment,
        totalPrice: totals.total,
        isFullyPaid: draft.payment.paidAmount >= totals.total,
      },
    });
  };

  const status = paymentStatus(draft.payment);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950/95">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-primary">
              Booking wizard
            </p>
            <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-slate-100">
              {editing ? "Modifier" : "Créer"} une réservation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-[1fr,320px]">
          <div className="space-y-4">
            <StepTabs step={step} setStep={setStep} />

            {step === "package" ? (
              <div className="section-shell space-y-3">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h4 className="font-heading text-lg font-semibold text-slate-900">
                    Package & type
                  </h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Package publié
                    <select
                      value={draft.packageId}
                      onChange={(e) =>
                        setDraft({ ...draft, packageId: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
                    >
                      <option value="">Sélectionner...</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.general.productName} ({p.general.stock} pax)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Type de réservation
                    <select
                      value={draft.bookingType}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          bookingType: e.target.value as Booking["bookingType"],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
                    >
                      <option value="En option">En option</option>
                      <option value="Confirmée">Confirmée</option>
                    </select>
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  En option: la date d&rsquo;expiration sera calculée
                  automatiquement à la confirmation.
                </p>
              </div>
            ) : null}

            {step === "rooming" ? (
              <div className="section-shell space-y-3">
                <div className="flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-primary" />
                  <h4 className="font-heading text-lg font-semibold text-slate-900">
                    Rooming list
                  </h4>
                </div>
                <RoomingEditor rooms={draft.rooms} setRooms={setRooms} />
                {stockExceeded ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    Stock insuffisant: restant {remainingStock} pax, demandés{" "}
                    {draft.paxTotal}.
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === "uploads" ? (
              <div className="section-shell space-y-3">
                <div className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <h4 className="font-heading text-lg font-semibold text-slate-900">
                    Uploads
                  </h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Passeports
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFiles(e, "passportScans")}
                      className="mt-1 w-full text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {draft.uploads.passportScans.length} fichier(s)
                    </p>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Documents requis
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFiles(e, "requiredDocuments")}
                      className="mt-1 w-full text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {draft.uploads.requiredDocuments.length} fichier(s)
                    </p>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                    Preuve de paiement
                    <input
                      type="file"
                      onChange={(e) => handleFiles(e, "paymentProofUrl")}
                      className="mt-1 w-full text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {draft.uploads.paymentProofUrl ? "1 fichier" : "Aucun"}
                    </p>
                  </label>
                </div>
              </div>
            ) : null}

            {step === "payment" ? (
              <div className="section-shell space-y-3">
                <div className="flex items-center gap-2">
                  <WalletCards className="h-5 w-5 text-primary" />
                  <h4 className="font-heading text-lg font-semibold text-slate-900">
                    Paiement
                  </h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Mode paiement
                    <input
                      value={draft.payment.paymentMethod}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          payment: {
                            ...draft.payment,
                            paymentMethod: e.target.value,
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Total (€)
                      <input
                        type="number"
                        value={draft.payment.totalPrice}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            payment: {
                              ...draft.payment,
                              totalPrice: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Payé (€)
                      <input
                        type="number"
                        value={draft.payment.paidAmount}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            payment: {
                              ...draft.payment,
                              paidAmount: Number(e.target.value) || 0,
                              isFullyPaid:
                                (Number(e.target.value) || 0) >=
                                draft.payment.totalPrice,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        status.label === "paid"
                          ? "bg-green-50 text-green-700"
                          : status.label === "partial"
                          ? "bg-amber-50 text-amber-700"
                          : status.label === "overpaid"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {status.text}
                    </span>
                    <span className="text-xs text-slate-500">
                      {draft.payment.paidAmount}/{draft.payment.totalPrice}€
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={recomputePrice}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      disabled={!pkg}
                    >
                      Recalculer total
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          payment: {
                            ...draft.payment,
                            paidAmount: draft.payment.totalPrice,
                            isFullyPaid: true,
                          },
                        })
                      }
                      className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                    >
                      Marquer payé
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {step === "confirm" ? (
              <div className="section-shell space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h4 className="font-heading text-lg font-semibold text-slate-900">
                    Confirmation
                  </h4>
                </div>
                <p className="text-sm text-slate-600">
                  Vérifie le résumé puis confirme l&rsquo;enregistrement.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Package" value={pkg?.general.productName ?? "—"} />
                  <SummaryRow label="Type" value={draft.bookingType} />
                  <SummaryRow label="Pax total" value={`${draft.paxTotal}`} />
                  <SummaryRow
                    label="Option jusqu'au"
                    value={
                      draft.bookingType === "En option"
                        ? computeReservedUntil()
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Total"
                    value={`${draft.payment.totalPrice}€`}
                  />
                  <SummaryRow
                    label="Payé"
                    value={`${draft.payment.paidAmount}€ (${status.text})`}
                  />
                </div>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  disabled={stockExceeded}
                >
                  {editing ? "Mettre à jour" : "Créer la réservation"}
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <aside className="space-y-3">
            <div className="card space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Résumé live
              </p>
              <p className="font-heading text-lg font-semibold text-slate-900">
                {pkg?.general.productName ?? "Sélectionner un package"}
              </p>
              <div className="text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Pax</span>
                  <span className="font-semibold">{draft.paxTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stock restant</span>
                  <span
                    className={`font-semibold ${
                      stockExceeded
                        ? "text-red-600"
                        : stockLow
                        ? "text-amber-700"
                        : "text-slate-900"
                    }`}
                  >
                    {remainingStock}
                  </span>
                </div>
                {totals ? (
                  <>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>ADL/CHD/INF</span>
                      <span>
                        {totals.pax.ADL}/{totals.pax.CHD}/{totals.pax.INF}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Unit (A/C/I)</span>
                      <span>
                        {formatMoney(totals.pricing.adultUnit)}/
                        {formatMoney(totals.pricing.childUnit)}/
                        {formatMoney(totals.pricing.infantUnit)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Total</span>
                      <span className="font-semibold">
                        {formatMoney(totals.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Commission agence</span>
                      <span>{formatMoney(totals.commissionTotal)}</span>
                    </div>
                  </>
                ) : null}
              </div>
              {stockLow ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Alerte: stock bas sur ce départ.
                </div>
              ) : null}
            </div>

            <div className="card p-4 text-xs text-slate-500">
              Étape actuelle: <span className="font-semibold">{step}</span>
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={prevStep}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
            disabled={step === "package"}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex gap-2">
            {step !== "confirm" ? (
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-40"
                disabled={!canGoNext()}
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTabs({
  step,
  setStep,
}: {
  step: Step;
  setStep: (s: Step) => void;
}) {
  const items: { key: Step; label: string }[] = [
    { key: "package", label: "Package" },
    { key: "rooming", label: "Rooming" },
    { key: "uploads", label: "Uploads" },
    { key: "payment", label: "Paiement" },
    { key: "confirm", label: "Confirmation" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={() => setStep(it.key)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            step === it.key
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function RoomingEditor({
  rooms,
  setRooms,
}: {
  rooms: BookingRoom[];
  setRooms: (rooms: BookingRoom[]) => void;
}) {
  const addRoom = () => {
    setRooms([
      ...rooms,
      { roomType: "Chambre", occupants: [{ type: "ADL" as const, name: "" }] },
    ]);
  };

  const updateRoomType = (idx: number, value: string) => {
    const next = [...rooms];
    next[idx] = { ...next[idx], roomType: value };
    setRooms(next);
  };

  const removeRoom = (idx: number) => {
    setRooms(rooms.filter((_, i) => i !== idx));
  };

  const addOcc = (roomIdx: number) => {
    const next = [...rooms];
    next[roomIdx] = {
      ...next[roomIdx],
      occupants: [
        ...next[roomIdx].occupants,
        { type: "ADL" as const, name: "" },
      ],
    };
    setRooms(next);
  };

  const removeOcc = (roomIdx: number, occIdx: number) => {
    const next = [...rooms];
    next[roomIdx] = {
      ...next[roomIdx],
      occupants: next[roomIdx].occupants.filter((_, i) => i !== occIdx),
    };
    setRooms(next);
  };

  const updateOcc = (
    roomIdx: number,
    occIdx: number,
    key: "type" | "name",
    value: string
  ) => {
    const next = [...rooms];
    const occupants = [...next[roomIdx].occupants];
    if (key === "type") {
      const type = (value as RoomOccupant["type"]) ?? "ADL";
      occupants[occIdx] = { ...occupants[occIdx], type };
    } else {
      occupants[occIdx] = { ...occupants[occIdx], name: value };
    }
    next[roomIdx] = { ...next[roomIdx], occupants };
    setRooms(next);
  };

  return (
    <div className="space-y-3">
      {rooms.map((room, roomIdx) => (
        <div key={roomIdx} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              value={room.roomType}
              onChange={(e) => updateRoomType(roomIdx, e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Type de chambre"
            />
            <button
              type="button"
              onClick={() => removeRoom(roomIdx)}
              className="text-xs font-semibold text-red-600"
            >
              Supprimer la chambre
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {room.occupants.map((occ, occIdx) => (
              <div
                key={occIdx}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <select
                  value={occ.type}
                  onChange={(e) => updateOcc(roomIdx, occIdx, "type", e.target.value)}
                  className="text-sm"
                >
                  <option value="ADL">ADL</option>
                  <option value="CHD">CHD</option>
                  <option value="INF">INF</option>
                </select>
                <input
                  value={occ.name ?? ""}
                  onChange={(e) => updateOcc(roomIdx, occIdx, "name", e.target.value)}
                  className="text-sm outline-none"
                  placeholder="Nom"
                />
                <button
                  type="button"
                  onClick={() => removeOcc(roomIdx, occIdx)}
                  className="text-xs font-semibold text-red-600"
                >
                  Suppr.
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOcc(roomIdx)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              Ajouter occupant
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRoom}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
      >
        Ajouter une chambre
      </button>
    </div>
  );
}
