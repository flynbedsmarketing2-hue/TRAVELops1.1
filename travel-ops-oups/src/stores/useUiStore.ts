'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makePersistStorage } from "./storeUtils";

export type ThemeMode = "light" | "dark";

type UiStore = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const storage = makePersistStorage();

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const next: ThemeMode = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
      },
    }),
    {
      name: "travelops-ui-store",
      storage,
    }
  )
);

