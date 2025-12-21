import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";
import type { Booking } from "../types";

export function useBookings() {
  const { data, error, isLoading, mutate } = useSWR<Booking[]>("/api/bookings", apiFetch);
  return {
    bookings: data ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
