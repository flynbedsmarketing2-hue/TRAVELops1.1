'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockBookings } from "../lib/mockData";
import type { Booking } from "../types";
import { generateId, makePersistStorage } from "./storeUtils";

type BookingStore = {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Booking;
  updateBooking: (
    id: string,
    updater: Partial<Booking>
  ) => Booking | null;
  deleteBooking: (id: string) => void;
  reset: () => void;
};

const storage = makePersistStorage();

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [...mockBookings],
      addBooking: (booking) => {
        const newBooking: Booking = {
          ...booking,
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
      reset: () => set({ bookings: [] }),
    }),
    {
      name: "travelops-bookings-store",
      storage,
    }
  )
);
