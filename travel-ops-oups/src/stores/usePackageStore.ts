'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FlightSegment, OpsProject, TravelPackage } from "../types";
import { mockPackages } from "../lib/mockData";
import { generateId, makePersistStorage } from "./storeUtils";

type PackageStore = {
  packages: TravelPackage[];
  addPackage: (pkg: Omit<TravelPackage, "id" | "opsProject">) => TravelPackage;
  updatePackage: (id: string, updater: Partial<TravelPackage>) => TravelPackage | null;
  deletePackage: (id: string) => void;
  duplicatePackage: (id: string, options?: { copyOps?: boolean }) => TravelPackage | null;
  importPackages: (imported: TravelPackage[], mode: "replace" | "merge") => number;
  exportPackages: () => TravelPackage[];
  setPackageStatus: (id: string, status: TravelPackage["status"]) => void;

  updateOpsGroupStatus: (
    packageId: string,
    groupId: string,
    status: "pending_validation" | "validated"
  ) => void;

  addSupplier: (
    packageId: string,
    groupId: string,
    supplier: OpsProject["groups"][number]["suppliers"][number]
  ) => void;
  removeSupplier: (packageId: string, groupId: string, supplierIndex: number) => void;

  addCostStep: (
    packageId: string,
    groupId: string,
    step: OpsProject["groups"][number]["costs"][number]
  ) => void;
  updateCostStep: (
    packageId: string,
    groupId: string,
    costIndex: number,
    updater: Partial<OpsProject["groups"][number]["costs"][number]>
  ) => void;
  removeCostStep: (packageId: string, groupId: string, costIndex: number) => void;

  addTimelineItem: (
    packageId: string,
    groupId: string,
    item: OpsProject["groups"][number]["timeline"][number]
  ) => void;
  updateTimelineItem: (
    packageId: string,
    groupId: string,
    itemIndex: number,
    updater: Partial<OpsProject["groups"][number]["timeline"][number]>
  ) => void;
  removeTimelineItem: (packageId: string, groupId: string, itemIndex: number) => void;

  reset: () => void;
};

const storage = makePersistStorage();

const formatFlightLabel = (flight: FlightSegment) => `${flight.airline} - départ ${flight.departureDate}`;

const flightStructureKey = (flight: FlightSegment) =>
  `${flight.departureDate || ""}|${flight.airline || ""}|${flight.returnDate || ""}`;

const groupStructureKey = (group: OpsProject["groups"][number]) =>
  `${group.departureDate || ""}|${group.airline || ""}|${group.returnDate || ""}`;

const hasFlightStructureChanged = (previousFlights: FlightSegment[], nextFlights: FlightSegment[]) => {
  if (previousFlights.length !== nextFlights.length) return true;
  const previousCounts = new Map<string, number>();
  previousFlights.forEach((flight) => {
    const key = flightStructureKey(flight);
    previousCounts.set(key, (previousCounts.get(key) ?? 0) + 1);
  });

  const nextCounts = new Map<string, number>();
  nextFlights.forEach((flight) => {
    const key = flightStructureKey(flight);
    nextCounts.set(key, (nextCounts.get(key) ?? 0) + 1);
  });

  if (previousCounts.size !== nextCounts.size) return true;
  for (const [key, count] of previousCounts) {
    if (nextCounts.get(key) !== count) return true;
  }
  return false;
};

function buildOpsGroupFromFlight(flight: FlightSegment, idx: number): OpsProject["groups"][number] {
  return {
    id: generateId(),
    flightLabel: formatFlightLabel(flight),
    airline: flight.airline,
    departureDate: flight.departureDate,
    returnDate: flight.returnDate,
    status: "pending_validation",
    validationDate: undefined,
    suppliers: [],
    costs: [],
    timeline: [
      {
        title: "Groupe créé",
        date: new Date().toISOString(),
        note: `Vol ${idx + 1}`,
        kind: "info",
      },
    ],
  };
}

function mergeOpsProject(existingOps: OpsProject | undefined, pkg: TravelPackage): OpsProject {
  const groupsByKey = new Map<string, OpsProject["groups"][number]>();
  const registerGroupKey = (key: string, group: OpsProject["groups"][number]) => {
    if (!groupsByKey.has(key)) groupsByKey.set(key, group);
  };
  existingOps?.groups.forEach((group) => {
    const baseKey = groupStructureKey(group);
    registerGroupKey(baseKey, group);
    if (group.departureDate) {
      registerGroupKey(`${group.departureDate}|${group.airline || ""}|`, group);
      registerGroupKey(`${group.departureDate}||`, group);
    }
  });

  const mergedGroups = pkg.flights.flights.map((flight, idx) => {
    const key = flightStructureKey(flight);
    const existing = groupsByKey.get(key);
    if (existing) {
      return {
        ...existing,
        flightLabel: formatFlightLabel(flight),
        airline: flight.airline,
        departureDate: flight.departureDate,
        returnDate: flight.returnDate,
      };
    }
    return buildOpsGroupFromFlight(flight, idx);
  });

  return {
    id: existingOps?.id ?? generateId(),
    packageId: pkg.id,
    groups: mergedGroups,
  };
}

function buildOpsProject(pkg: TravelPackage): OpsProject {
  return mergeOpsProject(undefined, pkg);
}

function normalizeImportedPackage(pkg: TravelPackage): TravelPackage {
  const id = pkg.id || generateId();
  const normalized: TravelPackage = {
    ...pkg,
    id,
    opsProject: pkg.opsProject
      ? {
          ...pkg.opsProject,
          id: pkg.opsProject.id || generateId(),
          packageId: id,
          groups: pkg.opsProject.groups.map((g) => ({
            ...g,
            id: g.id || generateId(),
            status: g.status || "pending_validation",
            suppliers: g.suppliers ?? [],
            costs: g.costs ?? [],
            timeline: g.timeline ?? [],
            departureDate: g.departureDate ?? undefined,
            returnDate: g.returnDate ?? undefined,
            airline: g.airline ?? undefined,
          })),
        }
      : undefined,
  };
  if (!normalized.opsProject) normalized.opsProject = buildOpsProject(normalized);
  return normalized;
}

const seedPackages: TravelPackage[] = mockPackages.map((pkg) => ({
  ...pkg,
  opsProject: pkg.opsProject ?? buildOpsProject(pkg),
}));

export const usePackageStore = create<PackageStore>()(
  persist(
    (set, get) => ({
      packages: seedPackages,

      addPackage: (pkg) => {
        const newPackage: TravelPackage = { ...pkg, id: generateId() };
        const withOps: TravelPackage = {
          ...newPackage,
          opsProject: buildOpsProject(newPackage),
        };
        set({ packages: [withOps, ...get().packages] });
        return withOps;
      },

      updatePackage: (id, updater) => {
        let updatedPackage: TravelPackage | null = null;
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== id) return pkg;
            updatedPackage = { ...pkg, ...updater };
            if (updater.flights) {
              const structureChanged = hasFlightStructureChanged(
                pkg.flights.flights,
                updatedPackage.flights.flights
              );
              if (structureChanged) {
                updatedPackage.opsProject = mergeOpsProject(pkg.opsProject, updatedPackage);
              }
            }
            return updatedPackage;
          }),
        });
        return updatedPackage;
      },

      deletePackage: (id) =>
        set({ packages: get().packages.filter((pkg) => pkg.id !== id) }),

      duplicatePackage: (id, options) => {
        const original = get().packages.find((pkg) => pkg.id === id);
        if (!original) return null;

        const duplicated: TravelPackage = {
          ...original,
          id: generateId(),
          status: "draft",
          general: {
            ...original.general,
            productCode: `${original.general.productCode}-COPY`,
            productName: `${original.general.productName} (Copy)`,
          },
        };

        const copyOps = Boolean(options?.copyOps);
        const opsProject: OpsProject = copyOps
          ? original.opsProject
            ? {
                ...original.opsProject,
                id: generateId(),
                packageId: duplicated.id,
                groups: original.opsProject.groups.map((g) => ({
                  ...g,
                  id: generateId(),
                  suppliers: g.suppliers ?? [],
                  costs: g.costs ?? [],
                  timeline: g.timeline ?? [],
                })),
              }
            : buildOpsProject(duplicated)
          : buildOpsProject(duplicated);

        const withOps: TravelPackage = { ...duplicated, opsProject };
        set({ packages: [withOps, ...get().packages] });
        return withOps;
      },

      importPackages: (imported, mode) => {
        if (!Array.isArray(imported)) return 0;
        const existingIds = new Set(get().packages.map((p) => p.id));

        const normalized = imported
          .filter(Boolean)
          .map((p) => normalizeImportedPackage(p))
          .map((p) => {
            if (!existingIds.has(p.id)) return p;
            const newId = generateId();
            return {
              ...p,
              id: newId,
              opsProject: p.opsProject
                ? { ...p.opsProject, packageId: newId }
                : buildOpsProject({ ...p, id: newId }),
            };
          });

        set({
          packages: mode === "replace" ? normalized : [...normalized, ...get().packages],
        });

        return normalized.length;
      },

      exportPackages: () => get().packages,

      setPackageStatus: (id, status) =>
        set({
          packages: get().packages.map((pkg) => (pkg.id === id ? { ...pkg, status } : pkg)),
        }),

      updateOpsGroupStatus: (packageId, groupId, status) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            const updatedGroups = pkg.opsProject.groups.map((group) => {
              if (group.id !== groupId) return group;
              return {
                ...group,
                status,
                validationDate: status === "validated" ? new Date().toISOString() : undefined,
              };
            });
            return { ...pkg, opsProject: { ...pkg.opsProject, groups: updatedGroups } };
          }),
        }),

      addSupplier: (packageId, groupId, supplier) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) =>
                  group.id === groupId ? { ...group, suppliers: [...group.suppliers, supplier] } : group
                ),
              },
            };
          }),
        }),

      removeSupplier: (packageId, groupId, supplierIndex) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) =>
                  group.id === groupId
                    ? { ...group, suppliers: group.suppliers.filter((_, idx) => idx !== supplierIndex) }
                    : group
                ),
              },
            };
          }),
        }),

      addCostStep: (packageId, groupId, step) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) =>
                  group.id === groupId ? { ...group, costs: [...group.costs, step] } : group
                ),
              },
            };
          }),
        }),

      updateCostStep: (packageId, groupId, costIndex, updater) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) => {
                  if (group.id !== groupId) return group;
                  const costs = group.costs.map((c, idx) => (idx === costIndex ? { ...c, ...updater } : c));
                  return { ...group, costs };
                }),
              },
            };
          }),
        }),

      removeCostStep: (packageId, groupId, costIndex) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) =>
                  group.id === groupId ? { ...group, costs: group.costs.filter((_, idx) => idx !== costIndex) } : group
                ),
              },
            };
          }),
        }),

      addTimelineItem: (packageId, groupId, item) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) =>
                  group.id === groupId ? { ...group, timeline: [...group.timeline, item] } : group
                ),
              },
            };
          }),
        }),

      updateTimelineItem: (packageId, groupId, itemIndex, updater) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) => {
                  if (group.id !== groupId) return group;
                  const timeline = group.timeline.map((t, idx) =>
                    idx === itemIndex ? { ...t, ...updater } : t
                  );
                  return { ...group, timeline };
                }),
              },
            };
          }),
        }),

      removeTimelineItem: (packageId, groupId, itemIndex) =>
        set({
          packages: get().packages.map((pkg) => {
            if (pkg.id !== packageId || !pkg.opsProject) return pkg;
            return {
              ...pkg,
              opsProject: {
                ...pkg.opsProject,
                groups: pkg.opsProject.groups.map((group) =>
                  group.id === groupId
                    ? { ...group, timeline: group.timeline.filter((_, idx) => idx !== itemIndex) }
                    : group
                ),
              },
            };
          }),
        }),

      reset: () => set({ packages: [] }),
    }),
    {
      name: "travelops-packages-store",
      storage,
    }
  )
);
