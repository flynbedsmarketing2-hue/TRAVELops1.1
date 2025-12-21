import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

const visaUpdateSchema = z.object({
  requirements: z.record(z.any()).optional(),
  processingDays: z.number().int().optional(),
  difficultyScore: z.number().int().optional(),
  lastUpdated: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = visaUpdateSchema.parse(await request.json());
    const existing = await prisma.visaRule.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.visaRule.update({
      where: { id: params.id },
      data: {
        requirements: payload.requirements ?? undefined,
        processingDays: payload.processingDays ?? undefined,
        difficultyScore: payload.difficultyScore ?? undefined,
        lastUpdated: payload.lastUpdated ? new Date(payload.lastUpdated) : undefined,
      },
    });
    await logAudit({
      entityType: "VisaRule",
      entityId: params.id,
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["administrator"]);
    const existing = await prisma.visaRule.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.visaRule.delete({ where: { id: params.id } });
    await logAudit({
      entityType: "VisaRule",
      entityId: params.id,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
