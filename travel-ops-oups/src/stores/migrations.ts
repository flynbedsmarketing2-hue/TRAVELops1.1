import type { OpsStatus } from "../types";

type PersistedState = { schemaVersion?: number } & Record<string, any>;

type Migration = (state: PersistedState) => PersistedState;

const OPS_STATUS_ALIASES: Record<string, OpsStatus> = {
  validated: "validated",
  validate: "validated",
  done: "validated",
  closed: "validated",
  approved: "validated",
  validation_pending: "pending_validation",
  pending_validation: "pending_validation",
  pending: "pending_validation",
  to_validate: "pending_validation",
  awaiting_validation: "pending_validation",
};

const migrateOpsStatusChanges: Migration = (state) => {
  if (!Array.isArray(state.packages)) return state;

  const packages = state.packages.map((pkg) => {
    const opsProject = pkg.opsProject ?? pkg.ops;
    if (!opsProject?.groups) return pkg;

    const groups = (opsProject.groups ?? opsProject.opsGroups ?? []).map((group: any) => {
      const rawStatus = group.status ?? group.opsStatus;
      const normalized =
        typeof rawStatus === "string" && rawStatus in OPS_STATUS_ALIASES
          ? OPS_STATUS_ALIASES[rawStatus]
          : rawStatus === "validated"
            ? "validated"
            : "pending_validation";

      return {
        ...group,
        status: normalized as OpsStatus,
        validationDate:
          group.validationDate ?? group.validatedAt ?? group.validation_date ?? group.confirmedAt,
        departureDate: group.departureDate ?? group.departure_date ?? group.flightDate,
      };
    });

    return {
      ...pkg,
      opsProject: {
        ...opsProject,
        id: opsProject.id ?? opsProject.opsId,
        packageId: opsProject.packageId ?? pkg.id,
        groups,
      },
    };
  });

  return { ...state, packages };
};

const migrateBookings: Migration = (state) => {
  if (!Array.isArray(state.bookings)) return state;

  const bookings = state.bookings.map((booking: any) => {
    const departureGroupId =
      booking.departureGroupId ?? booking.groupId ?? booking.opsGroupId ?? booking.flightGroupId;

    return {
      ...booking,
      departureGroupId,
    };
  });

  return { ...state, bookings };
};

const MIGRATIONS: Migration[] = [migrateOpsStatusChanges, migrateBookings];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.length;

export function migratePersistedState<T extends PersistedState>(state: T | undefined) {
  const startingState: PersistedState = state ? { ...state } : {};
  const startingVersion = Number.isInteger(startingState.schemaVersion)
    ? (startingState.schemaVersion as number)
    : 0;

  let nextState = startingState;

  for (let version = startingVersion; version < MIGRATIONS.length; version += 1) {
    const migration = MIGRATIONS[version];
    if (migration) {
      nextState = migration(nextState);
    }
    nextState.schemaVersion = version + 1;
  }

  if (!nextState.schemaVersion || nextState.schemaVersion < CURRENT_SCHEMA_VERSION) {
    nextState.schemaVersion = CURRENT_SCHEMA_VERSION;
  }

  return nextState as T & { schemaVersion: number };
}
