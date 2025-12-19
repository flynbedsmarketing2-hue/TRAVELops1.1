'use client';

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Plus, Save, Trash2 } from "lucide-react";
import type { TravelPackage } from "../types";
import { DEFAULT_RESPONSIBLE_NAME, generateProductCode, todayISO } from "../lib/packageDefaults";
import { usePackageStore } from "../stores/usePackageStore";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initialPackage?: TravelPackage;
};

const INPUT =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100";

const READONLY_INPUT =
  INPUT +
  " cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400 focus:border-slate-200 focus:ring-0 dark:focus:border-slate-800";

const TEXTAREA =
  "mt-1 min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100";

const emptyPackage = (): TravelPackage => ({
  id: "new-package",
  status: "draft",
  general: {
    productName: "",
    productCode: generateProductCode(),
    responsible: DEFAULT_RESPONSIBLE_NAME,
    creationDate: todayISO(),
    imageUrl: "",
    stock: 0,
  },
  flights: {
    destination: "",
    cities: [],
    flights: [
      {
        airline: "",
        departureDate: todayISO(),
        returnDate: todayISO(),
        duration: "",
        details: "",
      },
    ],
    visaStatus: "neant",
    transferStatus: "inclus",
  },
  accommodations: [{ name: "", category: "", pension: "", mapLink: "" }],
  pricing: [{ label: "Adulte (Double)", subLabel: "", unitPrice: 0, commission: 0 }],
  agencyCommissions: { adulte: { t1: 0, t2: 0, t3: 0 }, enfant: 0, bebe: 0 },
  content: { included: [], excluded: [], excursionsIncluded: [], excursionsExtra: [] },
  itinerary: {
    active: true,
    days: [{ dayNumber: 1, description: "" }],
    partnerName: "",
    emergencyContact: "",
    internalNotes: "",
    clientInformation: "",
  },
});

export function PackageEditor({ mode, initialPackage }: Props) {
  const router = useRouter();
  const { addPackage, updatePackage, setPackageStatus } = usePackageStore();

  const isEdit = mode === "edit";
  const [form, setForm] = useState<TravelPackage>(() => {
    const base = initialPackage ?? emptyPackage();
    return {
      ...base,
      general: {
        ...base.general,
        productCode: base.general.productCode || generateProductCode(),
        responsible: base.general.responsible || DEFAULT_RESPONSIBLE_NAME,
        creationDate: base.general.creationDate || todayISO(),
      },
    };
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const cityString = useMemo(() => form.flights.cities.join(", "), [form.flights.cities]);
  const lowestPrice = useMemo(() => {
    const prices = form.pricing.map((p) => Number(p.unitPrice) || 0).filter((p) => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [form.pricing]);

  const previewImage = form.general.imageUrl || "";

  const setStatus = (next: TravelPackage["status"]) => {
    if (next === "published") {
      const issues = validatePackage(form, { intent: "publish" });
      setErrors(issues);
      if (issues.length) return;
    }
    setErrors([]);
    setForm((prev) => ({ ...prev, status: next }));
  };

  const save = async (nextStatus?: TravelPackage["status"]) => {
    setSaving(true);
    try {
      const finalStatus = nextStatus ?? form.status;
      const issues = validatePackage(form, { intent: finalStatus === "published" ? "publish" : "save" });
      setErrors(issues);
      if (issues.length) return;

      const payload: TravelPackage = { ...form, status: finalStatus };
      if (isEdit && initialPackage) {
        updatePackage(initialPackage.id, payload);
        setPackageStatus(initialPackage.id, finalStatus);
        return;
      }

      const { id: _id, opsProject: _opsProject, ...data } = payload;
      void _id;
      void _opsProject;
      const created = addPackage(data);
      if (finalStatus !== "draft") setPackageStatus(created.id, finalStatus);
      router.replace(`/packages/${created.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setForm((prev) => ({ ...prev, general: { ...prev.general, imageUrl: base64 } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.08em] text-primary">
            {isEdit ? "Édition" : "Création"} du package
          </p>
          <h1 className="font-heading text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {form.general.productName || "Nouveau package"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Sections complètes, persistance localStorage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus("draft")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              form.status === "draft"
                ? "border-primary text-primary"
                : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
            }`}
          >
            Brouillon
          </button>
          <button
            type="button"
            onClick={() => setStatus("published")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              form.status === "published"
                ? "border-green-500 text-green-700 dark:text-green-300"
                : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
            }`}
          >
            Publié
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("published")}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Enregistrer & publier
          </button>
        </div>
      </div>

      {errors.length ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Merci de corriger :</p>
          <ul className="list-disc pl-5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <Section title="1. Informations générales">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nom du produit">
                <input
                  value={form.general.productName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, general: { ...p.general, productName: e.target.value } }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Code produit">
                <input
                  value={form.general.productCode}
                  readOnly
                  aria-readonly="true"
                  title="Champ rempli automatiquement"
                  className={READONLY_INPUT}
                />
              </Field>
              <Field label="Responsable">
                <input
                  value={form.general.responsible}
                  readOnly
                  aria-readonly="true"
                  title="Champ rempli automatiquement"
                  className={READONLY_INPUT}
                />
              </Field>
              <Field label="Date de création">
                <input
                  type="date"
                  value={form.general.creationDate}
                  readOnly
                  aria-readonly="true"
                  title="Champ rempli automatiquement"
                  className={READONLY_INPUT}
                />
              </Field>
              <Field label="Stock (pax)">
                <input
                  type="number"
                  value={form.general.stock}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, general: { ...p.general, stock: Number(e.target.value) || 0 } }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Image (URL ou fichier)">
                <input
                  value={form.general.imageUrl ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, general: { ...p.general, imageUrl: e.target.value } }))
                  }
                  className={INPUT}
                />
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200 md:col-span-2">
                <span className="flex items-center gap-2">
                  <ImageUp className="h-4 w-4 text-primary" />
                  Uploader une image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                  }}
                />
              </label>
            </div>
          </Section>

          <Section title="2. Vols & séjour">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Destination principale">
                <input
                  value={form.flights.destination}
                  onChange={(e) => setForm((p) => ({ ...p, flights: { ...p.flights, destination: e.target.value } }))}
                  className={INPUT}
                />
              </Field>
              <Field label="Villes (séparées par virgule)">
                <input
                  value={cityString}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      flights: {
                        ...p.flights,
                        cities: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  className={INPUT}
                />
              </Field>
            </div>

            <div className="space-y-3">
              {form.flights.flights.map((f, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Plan de vol #{idx + 1}
                    </p>
                    <button
                      type="button"
                      disabled={form.flights.flights.length <= 1}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          flights: { ...p.flights, flights: p.flights.flights.filter((_, i) => i !== idx) },
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-red-600 disabled:opacity-40 dark:border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Compagnie">
                      <input
                        value={f.airline}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            flights: {
                              ...p.flights,
                              flights: p.flights.flights.map((x, i) =>
                                i === idx ? { ...x, airline: e.target.value } : x
                              ),
                            },
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Durée (nuits/jours)">
                      <input
                        value={f.duration ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            flights: {
                              ...p.flights,
                              flights: p.flights.flights.map((x, i) =>
                                i === idx ? { ...x, duration: e.target.value } : x
                              ),
                            },
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Date aller">
                      <input
                        type="date"
                        value={f.departureDate}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            flights: {
                              ...p.flights,
                              flights: p.flights.flights.map((x, i) =>
                                i === idx ? { ...x, departureDate: e.target.value } : x
                              ),
                            },
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Date retour">
                      <input
                        type="date"
                        value={f.returnDate}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            flights: {
                              ...p.flights,
                              flights: p.flights.flights.map((x, i) =>
                                i === idx ? { ...x, returnDate: e.target.value } : x
                              ),
                            },
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Détails (horaires/confirmation)">
                      <textarea
                        value={f.details ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            flights: {
                              ...p.flights,
                              flights: p.flights.flights.map((x, i) =>
                                i === idx ? { ...x, details: e.target.value } : x
                              ),
                            },
                          }))
                        }
                        className={TEXTAREA}
                      />
                    </Field>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    flights: {
                      ...p.flights,
                      flights: [
                        ...p.flights.flights,
                        { airline: "", departureDate: todayISO(), returnDate: todayISO(), duration: "", details: "" },
                      ],
                    },
                  }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Ajouter un autre départ
              </button>
            </div>
          </Section>

          <Section title="3. Hébergements">
            <div className="space-y-3">
              {form.accommodations.map((acc, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-12"
                >
                  <div className="md:col-span-5">
                    <Field label="Nom">
                      <input
                        value={acc.name}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            accommodations: p.accommodations.map((x, i) =>
                              i === idx ? { ...x, name: e.target.value } : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Catégorie">
                      <input
                        value={acc.category ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            accommodations: p.accommodations.map((x, i) =>
                              i === idx ? { ...x, category: e.target.value } : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Pension">
                      <input
                        value={acc.pension ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            accommodations: p.accommodations.map((x, i) =>
                              i === idx ? { ...x, pension: e.target.value } : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-3">
                    <Field label="Lien map">
                      <input
                        value={acc.mapLink ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            accommodations: p.accommodations.map((x, i) =>
                              i === idx ? { ...x, mapLink: e.target.value } : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    <button
                      type="button"
                      disabled={form.accommodations.length <= 1}
                      onClick={() =>
                        setForm((p) => ({ ...p, accommodations: p.accommodations.filter((_, i) => i !== idx) }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-red-600 disabled:opacity-40 dark:border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    accommodations: [...p.accommodations, { name: "", category: "", pension: "", mapLink: "" }],
                  }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Ajouter un hébergement
              </button>
            </div>
          </Section>

          <Section title="4. Tarification">
            <div className="space-y-3">
              {form.pricing.map((p, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-12"
                >
                  <div className="md:col-span-4">
                    <Field label="Label">
                      <input
                        value={p.label}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            pricing: s.pricing.map((x, i) =>
                              i === idx ? { ...x, label: e.target.value } : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-4">
                    <Field label="Sous-label">
                      <input
                        value={p.subLabel ?? ""}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            pricing: s.pricing.map((x, i) =>
                              i === idx ? { ...x, subLabel: e.target.value } : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Prix / pax">
                      <input
                        type="number"
                        value={p.unitPrice}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            pricing: s.pricing.map((x, i) =>
                              i === idx
                                ? { ...x, unitPrice: Number(e.target.value) || 0 }
                                : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Commission">
                      <input
                        type="number"
                        value={p.commission ?? 0}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            pricing: s.pricing.map((x, i) =>
                              i === idx
                                ? { ...x, commission: Number(e.target.value) || 0 }
                                : x
                            ),
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    <button
                      type="button"
                      disabled={form.pricing.length <= 1}
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          pricing: s.pricing.filter((_, i) => i !== idx),
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-red-600 disabled:opacity-40 dark:border-slate-800"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setForm((s) => ({
                    ...s,
                    pricing: [
                      ...s.pricing,
                      { label: "Ligne tarif", subLabel: "", unitPrice: 0, commission: 0 },
                    ],
                  }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </button>
            </div>
          </Section>

          <Section title="5. Commissions agences">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Adulte 1–5 pax">
                <input
                  type="number"
                  value={form.agencyCommissions.adulte.t1}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      agencyCommissions: {
                        ...p.agencyCommissions,
                        adulte: { ...p.agencyCommissions.adulte, t1: Number(e.target.value) || 0 },
                      },
                    }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Adulte 6–9 pax">
                <input
                  type="number"
                  value={form.agencyCommissions.adulte.t2}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      agencyCommissions: {
                        ...p.agencyCommissions,
                        adulte: { ...p.agencyCommissions.adulte, t2: Number(e.target.value) || 0 },
                      },
                    }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Adulte 10–15 pax">
                <input
                  type="number"
                  value={form.agencyCommissions.adulte.t3}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      agencyCommissions: {
                        ...p.agencyCommissions,
                        adulte: { ...p.agencyCommissions.adulte, t3: Number(e.target.value) || 0 },
                      },
                    }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Enfant (fixe)">
                <input
                  type="number"
                  value={form.agencyCommissions.enfant}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      agencyCommissions: { ...p.agencyCommissions, enfant: Number(e.target.value) || 0 },
                    }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Bébé (fixe)">
                <input
                  type="number"
                  value={form.agencyCommissions.bebe}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      agencyCommissions: { ...p.agencyCommissions, bebe: Number(e.target.value) || 0 },
                    }))
                  }
                  className={INPUT}
                />
              </Field>
            </div>
          </Section>

          <Section title="6. Contenu & excursions">
            <div className="grid gap-4 md:grid-cols-2">
              <LinesField
                label="Inclus (1 ligne = 1 item)"
                value={form.content.included}
                onChange={(items) =>
                  setForm((p) => ({ ...p, content: { ...p.content, included: items } }))
                }
              />
              <LinesField
                label="Exclus"
                value={form.content.excluded}
                onChange={(items) =>
                  setForm((p) => ({ ...p, content: { ...p.content, excluded: items } }))
                }
              />
              <LinesField
                label="Excursions incluses"
                value={form.content.excursionsIncluded}
                onChange={(items) =>
                  setForm((p) => ({ ...p, content: { ...p.content, excursionsIncluded: items } }))
                }
              />
              <LinesField
                label="Excursions en extra"
                value={form.content.excursionsExtra}
                onChange={(items) =>
                  setForm((p) => ({ ...p, content: { ...p.content, excursionsExtra: items } }))
                }
              />
            </div>
          </Section>

          <Section title="7. Itinéraire">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Activer le programme</span>
              <input
                type="checkbox"
                checked={form.itinerary.active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, itinerary: { ...p.itinerary, active: e.target.checked } }))
                }
              />
            </label>

            <div className="space-y-3">
              {form.itinerary.days.map((d, idx) => {
                const dayDescriptionId = `day-description-${idx}`;
                return (
                  <div key={idx} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Jour {d.dayNumber}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => {
                            const nextDays = p.itinerary.days
                              .filter((_, i) => i !== idx)
                              .map((x, i) => ({ ...x, dayNumber: i + 1 }));
                            return {
                              ...p,
                              itinerary: {
                                ...p.itinerary,
                                days: nextDays.length ? nextDays : [{ dayNumber: 1, description: "" }],
                              },
                            };
                          })
                        }
                        className="text-xs font-semibold text-red-600"
                      >
                        Suppr.
                      </button>
                    </div>
                    <label className="mt-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor={dayDescriptionId}>
                      Description du jour {d.dayNumber}
                    </label>
                    <textarea
                      id={dayDescriptionId}
                      value={d.description}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          itinerary: {
                            ...p.itinerary,
                            days: p.itinerary.days.map((x, i) =>
                              i === idx ? { ...x, description: e.target.value } : x
                            ),
                          },
                        }))
                      }
                      className={TEXTAREA}
                    />
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    itinerary: {
                      ...p.itinerary,
                      days: [...p.itinerary.days, { dayNumber: p.itinerary.days.length + 1, description: "" }],
                    },
                  }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" />
                Ajouter un jour
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Partenaire local">
                <input
                  value={form.itinerary.partnerName ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, itinerary: { ...p.itinerary, partnerName: e.target.value } }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Contact urgence">
                <input
                  value={form.itinerary.emergencyContact ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, itinerary: { ...p.itinerary, emergencyContact: e.target.value } }))
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="Notes internes">
                <input
                  value={form.itinerary.internalNotes ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, itinerary: { ...p.itinerary, internalNotes: e.target.value } }))
                  }
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Information client">
              <textarea
                value={form.itinerary.clientInformation ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, itinerary: { ...p.itinerary, clientInformation: e.target.value } }))
                }
                className={TEXTAREA}
              />
            </Field>
          </Section>
        </div>

        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-slate-900">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImage} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                  Aperçu image
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Preview</p>
              <p className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
                {form.general.productName || "Nouveau package"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Destination: {form.flights.destination || "—"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Stock: <span className="font-semibold">{form.general.stock}</span> pax
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                À partir de:{" "}
                <span className="font-semibold">{lowestPrice !== null ? `${lowestPrice} DZD` : "—"}</span>
              </p>
            </div>
          </div>

          <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Raccourcis</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Publié est bloqué si des champs obligatoires manquent.</li>
              <li>Modifier les vols régénère les groupes Ops uniquement si la structure change.</li>
              <li>Images: URL ou fichier.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function validatePackage(pkg: TravelPackage, opts: { intent: "save" | "publish" }): string[] {
  const issues: string[] = [];
  const strict = opts.intent === "publish";

  if (!pkg.general.productName.trim()) issues.push("Nom du produit requis");
  if (!pkg.general.productCode.trim()) issues.push("Code produit requis");
  if (!pkg.general.responsible.trim()) issues.push("Responsable requis");
  if (!pkg.general.creationDate) issues.push("Date de création requise");
  if (!pkg.flights.destination.trim()) issues.push("Destination requise");
  if (pkg.general.stock < 0) issues.push("Stock doit être positif");

  if (!pkg.flights.flights.length) issues.push("Au moins un vol requis");
  pkg.flights.flights.forEach((f, idx) => {
    if (!f.airline.trim()) issues.push(`Vol ${idx + 1}: compagnie requise`);
    if (!f.departureDate) issues.push(`Vol ${idx + 1}: date départ requise`);
    if (!f.returnDate) issues.push(`Vol ${idx + 1}: date retour requise`);
  });

  if (!pkg.pricing.length) issues.push("Au moins un tarif requis");
  pkg.pricing.forEach((p, idx) => {
    if (!p.label.trim()) issues.push(`Tarif ${idx + 1}: label requis`);
    if (strict && (Number(p.unitPrice) || 0) <= 0) issues.push(`Tarif ${idx + 1}: prix > 0 requis`);
  });

  if (!pkg.itinerary.days.length) issues.push("Itinéraire: ajouter au moins un jour");
  if (strict) {
    pkg.itinerary.days.forEach((d, idx) => {
      if (!d.description.trim()) issues.push(`Itinéraire J${idx + 1}: description requise`);
    });
  }

  return issues;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="section-shell">
      <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="pt-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function LinesField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        className={TEXTAREA}
      />
    </Field>
  );
}
