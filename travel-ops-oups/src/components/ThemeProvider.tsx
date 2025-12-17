'use client';

import { useEffect } from "react";
import { useUiStore } from "../stores/useUiStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUiStore();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}

