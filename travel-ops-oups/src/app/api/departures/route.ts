import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { departureSchema } from "../../../lib/validation";
import { logAudit } from "../../../lib/audit";

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const departures = await prisma.departure.findMany({
      orderBy: { departureDate: "asc" },
      include: {
        supplierLinks: { include: { supplier: true } },
        costLines: true,
        timelineItems: true,
      },
    });
    return NextResponse.json(departures);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = departureSchema.parse(await request.json());
    const created = await prisma.departure.create({
      data: {
        packageId: payload.packageId,
        flightLabel: payload.flightLabel,
        airline: payload.airline ?? null,
        departureDate: payload.departureDate ? new Date(payload.departureDate) : null,
        returnDate: payload.returnDate ? new Date(payload.returnDate) : null,
        status: payload.status,
      },
    });
    await logAudit({
      entityType: "Departure",
      entityId: created.id,
      action: "create",
      actorId: session.user.id,
      afterJson: created,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
