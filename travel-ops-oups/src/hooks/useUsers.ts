import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";
import type { User } from "../types";

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<User[]>("/api/users", apiFetch);
  return {
    users: data ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
