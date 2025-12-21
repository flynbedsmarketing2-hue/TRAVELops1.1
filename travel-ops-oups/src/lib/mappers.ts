import type { Prisma } from "@prisma/client";

export function mapPackageForUi(
  pkg: Prisma.PackageGetPayload<{
    include: {
      departures: {
        include: {
          supplierLinks: { include: { supplier: true } };
          costLines: true;
          timelineItems: true;
        };
      };
    };
  }>
) {
  return {
    id: pkg.id,
    status: pkg.status === "published" ? "published" : "draft",
    general: pkg.general,
    flights: pkg.flights,
    accommodations: pkg.accommodations,
    pricing: pkg.pricing,
    agencyCommissions: pkg.agencyCommissions,
    content: pkg.content,
    itinerary: pkg.itinerary,
    metadata: pkg.metadata ?? undefined,
    opsProject: {
      id: `ops-${pkg.id}`,
      packageId: pkg.id,
      groups: pkg.departures.map((departure) => ({
        id: departure.id,
        flightLabel: departure.flightLabel,
        airline: departure.airline ?? undefined,
        departureDate: departure.departureDate?.toISOString().slice(0, 10),
        returnDate: departure.returnDate?.toISOString().slice(0, 10),
        status: departure.status === "validated" ? "validated" : "pending_validation",
        validationDate: departure.validationDate?.toISOString(),
        suppliers: departure.supplierLinks.map((link) => ({
          linkId: link.id,
          name: link.supplier.name,
          contact: link.notes ?? undefined,
          cost: link.cost ?? undefined,
          deadline: link.deadline?.toISOString().slice(0, 10),
        })),
        costs: departure.costLines.map((line) => ({
          id: line.id,
          label: line.label,
          amount: line.amount,
          dueDate: line.dueDate?.toISOString().slice(0, 10),
          paid: line.paid,
        })),
        timeline: departure.timelineItems.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date?.toISOString(),
          note: item.note ?? undefined,
          kind: item.kind ?? undefined,
        })),
      })),
    },
  };
}
