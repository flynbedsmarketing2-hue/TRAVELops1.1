import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { taskTemplateSchema } from "../../../lib/validation";
import { logAudit } from "../../../lib/audit";

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const templates = await prisma.taskTemplate.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = taskTemplateSchema.parse(await request.json());
    const created = await prisma.taskTemplate.create({
      data: {
        name: payload.name,
        description: payload.description ?? null,
        productType: payload.productType ?? null,
        offsetDays: payload.offsetDays,
        defaultRole: payload.defaultRole ?? null,
      },
    });
    await logAudit({
      entityType: "TaskTemplate",
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
