import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";

const destinationSchema = z.object({
  country: z.string().min(1),
  city: z.string().optional(),
  tags: z.array(z.string()).default([]),
  seasonality: z.string().optional(),
  bestMonths: z.array(z.string()).default([]),
  segmentFit: z.string().optional(),
  riskLevel: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const destinations = await prisma.destination.findMany({
      orderBy: { country: "asc" },
      include: { visaRules: true, events: true },
    });
    return NextResponse.json(destinations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = destinationSchema.parse(await request.json());
    const created = await prisma.destination.create({
      data: {
        country: payload.country,
        city: payload.city ?? null,
        tags: payload.tags,
        seasonality: payload.seasonality ?? null,
        bestMonths: payload.bestMonths,
        segmentFit: payload.segmentFit ?? null,
        riskLevel: payload.riskLevel ?? null,
        notes: payload.notes ?? null,
      },
    });
    await logAudit({
      entityType: "Destination",
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
