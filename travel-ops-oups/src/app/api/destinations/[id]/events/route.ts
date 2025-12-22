import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/apiAuth";
import { handleApiError } from "../../../../../lib/apiResponse";
import { logAudit } from "../../../../../lib/audit";
import { getParams, RouteContext } from "../../../../../lib/routeParams";

const eventSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  type: z.string().min(1),
  impactScore: z.number().int().optional(),
});

export async function POST(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = eventSchema.parse(await request.json());
    const created = await prisma.event.create({
      data: {
        destinationId: id,
        name: payload.name,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        type: payload.type,
        impactScore: payload.impactScore ?? null,
      },
    });
    await logAudit({
      entityType: "Event",
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


