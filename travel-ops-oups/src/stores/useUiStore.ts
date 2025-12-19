'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CURRENT_SCHEMA_VERSION } from "./migrations";
import { withPersistMigrations } from "./storeUtils";

export type ThemeMode = "light" | "dark";

type UiStore = {
  schemaVersion: number;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const persistConfig = withPersistMigrations<UiStore>("travelops-ui-store");

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const next: ThemeMode = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
      },
    }),
    persistConfig
  )
);
