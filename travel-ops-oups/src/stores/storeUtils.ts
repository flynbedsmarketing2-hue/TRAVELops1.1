import type { PersistOptions } from "zustand/middleware";
import { StateStorage, createJSONStorage } from "zustand/middleware";
import { CURRENT_SCHEMA_VERSION, migratePersistedState } from "./migrations";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const makePersistStorage = () =>
  createJSONStorage(() =>
    typeof window === "undefined" ? noopStorage : window.localStorage
  );

export const withPersistMigrations = <T>(
  name: string,
  options?: Partial<PersistOptions<T>>
): PersistOptions<T> => {
  const storage = makePersistStorage();
  const { onRehydrateStorage, ...rest } = options ?? {};

  return {
    name,
    storage,
    version: CURRENT_SCHEMA_VERSION,
    migrate: (state) => migratePersistedState(state),
    onRehydrateStorage: (state, error) => {
      const afterHydrate = onRehydrateStorage?.(state, error);
      return (hydratedState, hydrateError) => {
        const nextState = (hydratedState ?? {}) as Record<string, unknown>;
        nextState.schemaVersion = CURRENT_SCHEMA_VERSION;
        try {
          storage.setItem(
            name,
            JSON.stringify(nextState)
          );
        } catch (err) {
          console.warn("[persist] failed to rewrite migrated state", err);
        }
        return afterHydrate?.(hydratedState, hydrateError);
      };
    },
    ...rest,
  };
};

export const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
