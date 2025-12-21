import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = (await request.json()) as {
      name?: string;
      description?: string;
      productType?: string;
      offsetDays?: number;
      defaultRole?: string;
    };
    const existing = await prisma.taskTemplate.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.taskTemplate.update({
      where: { id: id },
      data: {
        name: payload.name ?? undefined,
        description: payload.description ?? undefined,
        productType: payload.productType ?? undefined,
        offsetDays: payload.offsetDays ?? undefined,
        defaultRole: payload.defaultRole ?? undefined,
      },
    });
    await logAudit({
      entityType: "TaskTemplate",
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
    const existing = await prisma.taskTemplate.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.taskTemplate.delete({ where: { id: id } });
    await logAudit({
      entityType: "TaskTemplate",
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


