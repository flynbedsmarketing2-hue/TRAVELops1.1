'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockUsers } from "../lib/mockData";
import type { User } from "../types";
import { CURRENT_SCHEMA_VERSION } from "./migrations";
import { generateId, withPersistMigrations } from "./storeUtils";

type AuthResult = {
  success: boolean;
  message?: string;
};

type UserStore = {
  users: User[];
  currentUser: User | null;
  login: (username: string, password: string) => AuthResult;
  logout: () => void;
  register: (user: Omit<User, "id">) => User;
  updateUser: (id: string, updater: Partial<Omit<User, "id">>) => User | null;
  deleteUser: (id: string) => boolean;
  resetPassword: (id: string, newPassword: string) => boolean;
  seedDemoUsers: () => void;
  ensureAdmin: () => void;
  schemaVersion: number;
};

const defaultAdmin: User = {
  id: "seed-admin",
  username: "admin",
  password: "password",
  role: "administrator",
  fullName: "Admin",
};

const seedUsers: User[] = [defaultAdmin, ...mockUsers];

const persistConfig = withPersistMigrations<UserStore>("travelops-user-store", {
  onRehydrateStorage: () => (state) => {
    state?.ensureAdmin();
  },
});

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      currentUser: null,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      login: (username, password) => {
        const found = get().users.find(
          (user) => user.username === username && user.password === password
        );
        if (!found) {
          return { success: false, message: "Identifiants invalides" };
        }
        set({ currentUser: found });
        return { success: true };
      },
      logout: () => set({ currentUser: null }),
      register: (user) => {
        const newUser: User = { ...user, id: generateId() };
        set({ users: [...get().users, newUser] });
        return newUser;
      },
      updateUser: (id, updater) => {
        const existing = get().users.find((u) => u.id === id);
        if (!existing) return null;
        const next: User = { ...existing, ...updater, id: existing.id };
        set({
          users: get().users.map((u) => (u.id === id ? next : u)),
          currentUser:
            get().currentUser?.id === id ? next : get().currentUser,
        });
        return next;
      },
      deleteUser: (id) => {
        if (id === defaultAdmin.id) return false;
        set({
          users: get().users.filter((u) => u.id !== id),
          currentUser:
            get().currentUser?.id === id ? null : get().currentUser,
        });
        return true;
      },
      resetPassword: (id, newPassword) => {
        if (!newPassword.trim()) return false;
        const updated = get().updateUser(id, { password: newPassword });
        return Boolean(updated);
      },
      seedDemoUsers: () => {
        const existing = new Set(get().users.map((u) => u.username));
        const toAdd = mockUsers.filter((u) => !existing.has(u.username));
        if (!toAdd.length) return;
        set({
          users: [...get().users, ...toAdd.map((u) => ({ ...u }))],
        });
      },
      ensureAdmin: () => {
        const hasAdmin = get().users.some(
          (u) => u.username === defaultAdmin.username
        );
        if (!hasAdmin) {
          set({ users: [...get().users, defaultAdmin] });
        }
      },
    }),
    { ...persistConfig, skipHydration: false }
  )
);
