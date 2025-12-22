import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { packageUpdateSchema } from "../../../../lib/validation";
import {
  buildDeparturesFromFlights,
  departureStructureKey,
  flightStructureKey,
  hasFlightStructureChanged,
} from "../../../../lib/opsBuilder";
import { mapPackageForUi } from "../../../../lib/mappers";
import { logAudit } from "../../../../lib/audit";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const pkg = await prisma.package.findUnique({
      where: { id: id },
      include: {
        departures: {
          include: {
            supplierLinks: { include: { supplier: true } },
            costLines: true,
            timelineItems: true,
          },
        },
      },
    });
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mapPackageForUi(pkg));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = packageUpdateSchema.parse(await request.json());

    const existing = await prisma.package.findUnique({
      where: { id: id },
      include: { departures: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const previousFlights = ((existing.flights as { flights?: unknown[] })?.flights ?? []) as {
      airline: string;
      departureDate: string;
      returnDate: string;
    }[];
    const nextFlights = payload.flights?.flights ?? previousFlights;
    const structureChanged = payload.flights
      ? hasFlightStructureChanged(previousFlights, nextFlights)
      : false;

    const updated = await prisma.package.update({
      where: { id: id },
      data: {
        status: payload.status ?? undefined,
        general: payload.general ?? undefined,
        flights: payload.flights ?? undefined,
        accommodations: payload.accommodations ?? undefined,
        pricing: payload.pricing ?? undefined,
        agencyCommissions: payload.agencyCommissions ?? undefined,
        content: payload.content ?? undefined,
        itinerary: payload.itinerary ?? undefined,
        metadata: payload.metadata ?? undefined,
      },
      include: {
        departures: {
          include: {
            supplierLinks: { include: { supplier: true } },
            costLines: true,
            timelineItems: true,
          },
        },
      },
    });

    if (structureChanged) {
      const existingDepartures = existing.departures.map((dep) => ({
        id: dep.id,
        airline: dep.airline,
        departureDate: dep.departureDate,
        returnDate: dep.returnDate,
        flightLabel: dep.flightLabel,
      }));

      const index = new Map<string, typeof existingDepartures[number]>();
      existingDepartures.forEach((dep) => {
        index.set(departureStructureKey(dep), dep);
        if (dep.departureDate) {
          const date = dep.departureDate.toISOString().slice(0, 10);
          index.set(`${date}|${dep.airline || ""}|`, dep);
          index.set(`${date}||`, dep);
        }
      });

      const matchedIds = new Set<string>();
      for (const flight of nextFlights) {
        const key = flightStructureKey(flight);
        const candidate =
          index.get(key) ??
          index.get(`${flight.departureDate}|${flight.airline || ""}|`) ??
          index.get(`${flight.departureDate}||`);
        if (candidate) {
          matchedIds.add(candidate.id);
          await prisma.departure.update({
            where: { id: candidate.id },
            data: {
              flightLabel: `${flight.airline} - depart ${flight.departureDate}`,
              airline: flight.airline,
              departureDate: flight.departureDate ? new Date(flight.departureDate) : null,
              returnDate: flight.returnDate ? new Date(flight.returnDate) : null,
            },
          });
        }
      }

      const removed = existing.departures.filter((dep) => !matchedIds.has(dep.id));
      if (removed.length) {
        await prisma.departure.deleteMany({
          where: { id: { in: removed.map((dep) => dep.id) } },
        });
      }

      const existingKeys = new Set(
        existing.departures.map((dep) =>
          departureStructureKey({
            id: dep.id,
            airline: dep.airline,
            departureDate: dep.departureDate,
            returnDate: dep.returnDate,
            flightLabel: dep.flightLabel,
          })
        )
      );
      const toCreate = nextFlights.filter((flight) => !existingKeys.has(flightStructureKey(flight)));
      if (toCreate.length) {
        await prisma.departure.createMany({
          data: buildDeparturesFromFlights(toCreate).map((dep) => ({
            packageId: existing.id,
            flightLabel: dep.flightLabel,
            airline: dep.airline ?? null,
            departureDate: dep.departureDate ?? null,
            returnDate: dep.returnDate ?? null,
            status: "pending_validation",
          })),
        });
      }
    }

    await logAudit({
      entityType: "Package",
      entityId: existing.id,
      action: "update",
      actorId: session.user.id,
      beforeJson: existing,
      afterJson: updated,
    });

    const refreshed = await prisma.package.findUnique({
      where: { id: id },
      include: {
        departures: {
          include: {
            supplierLinks: { include: { supplier: true } },
            costLines: true,
            timelineItems: true,
          },
        },
      },
    });
    if (!refreshed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mapPackageForUi(refreshed));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator"]);
    const existing = await prisma.package.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.package.delete({ where: { id: id } });
    await logAudit({
      entityType: "Package",
      entityId: id,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

