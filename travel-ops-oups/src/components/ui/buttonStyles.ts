import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background-light disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-background-dark";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm shadow-black/5 hover:bg-primary/90 active:bg-primary/85",
  secondary:
    "bg-slate-900 text-white shadow-sm shadow-black/10 hover:bg-slate-800 active:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
  outline:
    "border border-slate-200 bg-white text-slate-900 shadow-sm shadow-black/5 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:hover:bg-slate-900/60",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-900/60",
  danger:
    "bg-red-600 text-white shadow-sm shadow-black/10 hover:bg-red-500 active:bg-red-600",
};

export const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-10 w-10",
};

export function buttonClassName(options?: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  return cn(
    buttonBase,
    buttonVariants[options?.variant ?? "primary"],
    buttonSizes[options?.size ?? "md"],
    options?.className
  );
}

