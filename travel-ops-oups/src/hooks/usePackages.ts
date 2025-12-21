import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";
import type { TravelPackage } from "../types";

export function usePackages() {
  const { data, error, isLoading, mutate } = useSWR<TravelPackage[]>("/api/packages", apiFetch);
  return {
    packages: data ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
