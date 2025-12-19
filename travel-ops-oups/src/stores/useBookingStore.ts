'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockBookings } from "../lib/mockData";
import type { Booking } from "../types";
import { CURRENT_SCHEMA_VERSION } from "./migrations";
import { generateId, withPersistMigrations } from "./storeUtils";

type BookingStore = {
  bookings: Booking[];
  schemaVersion: number;
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Booking;
  updateBooking: (
    id: string,
    updater: Partial<Booking>
  ) => Booking | null;
  deleteBooking: (id: string) => void;
  reset: () => void;
};

const persistConfig = withPersistMigrations<BookingStore>("travelops-bookings-store");

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [...mockBookings],
      schemaVersion: CURRENT_SCHEMA_VERSION,
      addBooking: (booking) => {
        const newBooking: Booking = {
          ...booking,
          departureGroupId: booking.departureGroupId ?? undefined,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set({ bookings: [newBooking, ...get().bookings] });
        return newBooking;
      },
      updateBooking: (id, updater) => {
        let result: Booking | null = null;
        set({
          bookings: get().bookings.map((existing) => {
            if (existing.id !== id) return existing;
            result = { ...existing, ...updater };
            return result;
          }),
        });
        return result;
      },
      deleteBooking: (id) =>
        set({ bookings: get().bookings.filter((booking) => booking.id !== id) }),
      reset: () => set({ bookings: [], schemaVersion: CURRENT_SCHEMA_VERSION }),
    }),
    persistConfig
  )
);
