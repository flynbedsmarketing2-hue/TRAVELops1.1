import type { Booking, BookingRoom, TravelPackage } from "../types";

export type PaxCounts = {
  ADL: number;
  CHD: number;
  INF: number;
};

export type ResolvedPricing = {
  adultUnit: number;
  childUnit: number;
  infantUnit: number;
};

export type PricingTotals = {
  pax: PaxCounts;
  subtotal: number;
  commissionTotal: number;
  total: number;
  pricing: ResolvedPricing;
};

export function computePaxCounts(rooms: BookingRoom[]): PaxCounts {
  return rooms.reduce(
    (acc, room) => {
      for (const occ of room.occupants) {
        acc[occ.type] += 1;
      }
      return acc;
    },
    { ADL: 0, CHD: 0, INF: 0 } as PaxCounts
  );
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

function findUnitPrice(pkg: TravelPackage, keywords: string[]): number {
  const candidates = pkg.pricing
    .map((p) => ({
      label: normalize(`${p.label} ${p.subLabel ?? ""}`),
      unit: p.unitPrice,
    }))
    .filter((p) => p.unit > 0);

  const match = candidates.find((c) =>
    keywords.some((k) => c.label.includes(k))
  );
  if (match) return match.unit;

  const min = candidates.reduce((acc, p) => Math.min(acc, p.unit), Infinity);
  return Number.isFinite(min) ? min : 0;
}

export function resolvePricing(pkg: TravelPackage): ResolvedPricing {
  return {
    adultUnit: findUnitPrice(pkg, ["adulte", "adult", "adl"]),
    childUnit: findUnitPrice(pkg, ["enfant", "child", "chd"]),
    infantUnit: findUnitPrice(pkg, ["bebe", "bébé", "infant", "inf"]),
  };
}

export function computeCommissionTotal(
  pkg: TravelPackage,
  pax: PaxCounts
): number {
  const payingPax = pax.ADL + pax.CHD;
  const tier =
    payingPax <= 5 ? "t1" : payingPax <= 9 ? "t2" : payingPax <= 15 ? "t3" : "t3";
  const adultCom = pkg.agencyCommissions.adulte[tier];
  const childCom = pkg.agencyCommissions.enfant;
  const infantCom = pkg.agencyCommissions.bebe;
  return pax.ADL * adultCom + pax.CHD * childCom + pax.INF * infantCom;
}

export function computeTotals(
  pkg: TravelPackage,
  rooms: BookingRoom[]
): PricingTotals {
  const pax = computePaxCounts(rooms);
  const pricing = resolvePricing(pkg);
  const subtotal =
    pax.ADL * pricing.adultUnit +
    pax.CHD * pricing.childUnit +
    pax.INF * pricing.infantUnit;
  const commissionTotal = computeCommissionTotal(pkg, pax);
  return {
    pax,
    pricing,
    subtotal,
    commissionTotal,
    total: subtotal,
  };
}

export function paymentStatus(payment: Booking["payment"]): {
  label: "unpaid" | "partial" | "paid" | "overpaid";
  text: string;
} {
  if (payment.totalPrice <= 0) return { label: "unpaid", text: "Non payé" };
  if (payment.paidAmount <= 0) return { label: "unpaid", text: "Non payé" };
  if (payment.paidAmount < payment.totalPrice)
    return { label: "partial", text: "Partiel" };
  if (payment.paidAmount === payment.totalPrice)
    return { label: "paid", text: "Payé" };
  return { label: "overpaid", text: "Surpayé" };
}

export function formatMoney(amount: number, currency = "€") {
  if (!Number.isFinite(amount)) return "—";
  return `${Math.round(amount * 100) / 100}${currency}`;
}

