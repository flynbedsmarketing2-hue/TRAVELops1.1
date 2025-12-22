import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

const eventUpdateSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.string().optional(),
  impactScore: z.number().int().optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = eventUpdateSchema.parse(await request.json());
    const existing = await prisma.event.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.event.update({
      where: { id: id },
      data: {
        name: payload.name ?? undefined,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        type: payload.type ?? undefined,
        impactScore: payload.impactScore ?? undefined,
      },
    });
    await logAudit({
      entityType: "Event",
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

export async function DELETE(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator"]);
    const existing = await prisma.event.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.event.delete({ where: { id: id } });
    await logAudit({
      entityType: "Event",
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


