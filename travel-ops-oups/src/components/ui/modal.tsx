'use client';

import { useEffect } from "react";
import { cn } from "./cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer la modale"
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/15 dark:border-slate-800 dark:bg-slate-950/95",
          className
        )}
      >
        {title ? (
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <p className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          </div>
        ) : null}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
