import type { OpsGroup, OpsPaymentStep, Supplier } from "../types";

export function daysUntil(isoDate?: string): number | null {
  if (!isoDate) return null;
  const now = new Date();
  const d = new Date(isoDate);
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

export function isOverdue(isoDate?: string): boolean {
  if (!isoDate) return false;
  const now = new Date();
  const d = new Date(isoDate);
  return d.getTime() < now.getTime();
}

export function paymentStepStatus(step: OpsPaymentStep): "paid" | "due" | "overdue" {
  if (step.paid) return "paid";
  if (step.dueDate && isOverdue(step.dueDate)) return "overdue";
  return "due";
}

export function supplierDeadlineStatus(supplier: Supplier): "ok" | "overdue" {
  if (!supplier.deadline) return "ok";
  return isOverdue(supplier.deadline) ? "overdue" : "ok";
}

export function groupAlerts(group: OpsGroup) {
  const overdueCosts = group.costs.filter((c) => paymentStepStatus(c) === "overdue").length;
  const overdueSuppliers = group.suppliers.filter((s) => supplierDeadlineStatus(s) === "overdue").length;
  return { overdueCosts, overdueSuppliers };
}

