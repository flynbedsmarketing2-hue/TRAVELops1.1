import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { packageSchema } from "../../../lib/validation";
import { buildDeparturesFromFlights } from "../../../lib/opsBuilder";
import { mapPackageForUi } from "../../../lib/mappers";
import { logAudit } from "../../../lib/audit";

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: "desc" },
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
    return NextResponse.json(packages.map(mapPackageForUi));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = packageSchema.parse(await request.json());
    const created = await prisma.package.create({
      data: {
        status: payload.status,
        general: payload.general,
        flights: payload.flights,
        accommodations: payload.accommodations,
        pricing: payload.pricing,
        agencyCommissions: payload.agencyCommissions,
        content: payload.content,
        itinerary: payload.itinerary,
        metadata: payload.metadata ?? undefined,
        ownerId: session.user.id,
        departures: {
          create: buildDeparturesFromFlights(payload.flights.flights),
        },
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

    await logAudit({
      entityType: "Package",
      entityId: created.id,
      action: "create",
      actorId: session.user.id,
      afterJson: created,
    });

    return NextResponse.json(mapPackageForUi(created), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
