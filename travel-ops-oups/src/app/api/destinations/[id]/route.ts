import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

const destinationUpdateSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seasonality: z.string().optional(),
  bestMonths: z.array(z.string()).optional(),
  segmentFit: z.string().optional(),
  riskLevel: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const destination = await prisma.destination.findUnique({
      where: { id: id },
      include: { visaRules: true, events: true },
    });
    if (!destination) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(destination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = destinationUpdateSchema.parse(await request.json());
    const existing = await prisma.destination.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.destination.update({
      where: { id: id },
      data: {
        country: payload.country ?? undefined,
        city: payload.city ?? undefined,
        tags: payload.tags ?? undefined,
        seasonality: payload.seasonality ?? undefined,
        bestMonths: payload.bestMonths ?? undefined,
        segmentFit: payload.segmentFit ?? undefined,
        riskLevel: payload.riskLevel ?? undefined,
        notes: payload.notes ?? undefined,
      },
    });
    await logAudit({
      entityType: "Destination",
      entityId: id,
      action: "update",
      actorId: session.user.id,
      beforeJson: existing,
      afterJson: updated,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator"]);
    const existing = await prisma.destination.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.destination.delete({ where: { id: id } });
    await logAudit({
      entityType: "Destination",
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


