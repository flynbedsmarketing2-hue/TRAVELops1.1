import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = (await request.json()) as {
      title?: string;
      dueDate?: string | null;
      status?: "pending" | "in_progress" | "done" | "blocked";
      assigneeId?: string | null;
      notes?: string | null;
    };
    const existing = await prisma.taskInstance.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.taskInstance.update({
      where: { id: params.id },
      data: {
        title: payload.title ?? undefined,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : payload.dueDate === null ? null : undefined,
        status: payload.status ?? undefined,
        assigneeId: payload.assigneeId ?? undefined,
        notes: payload.notes ?? undefined,
      },
    });
    await logAudit({
      entityType: "TaskInstance",
      entityId: updated.id,
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
    const session = await requireRole(["administrator", "travel_designer"]);
    const existing = await prisma.taskInstance.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.taskInstance.delete({ where: { id: params.id } });
    await logAudit({
      entityType: "TaskInstance",
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
