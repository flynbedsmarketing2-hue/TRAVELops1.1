import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { taskInstanceSchema } from "../../../lib/validation";
import { logAudit } from "../../../lib/audit";

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const tasks = await prisma.taskInstance.findMany({
      orderBy: { dueDate: "asc" },
      include: { assignee: true, departure: true },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = taskInstanceSchema.parse(await request.json());
    const created = await prisma.taskInstance.create({
      data: {
        departureId: payload.departureId,
        title: payload.title,
        dueDate: new Date(payload.dueDate),
        status: payload.status,
        assigneeId: payload.assigneeId ?? null,
        notes: payload.notes ?? null,
      },
    });
    await logAudit({
      entityType: "TaskInstance",
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
