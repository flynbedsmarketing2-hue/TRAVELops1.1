import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/apiAuth";
import { handleApiError } from "../../../../../lib/apiResponse";
import { logAudit } from "../../../../../lib/audit";
import { getParams, RouteContext } from "../../../../../lib/routeParams";

const visaSchema = z.object({
  requirements: z.record(z.any()),
  processingDays: z.number().int().optional(),
  difficultyScore: z.number().int().optional(),
  lastUpdated: z.string().optional(),
});

export async function POST(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = visaSchema.parse(await request.json());
    const created = await prisma.visaRule.create({
      data: {
        destinationId: id,
        requirements: payload.requirements,
        processingDays: payload.processingDays ?? null,
        difficultyScore: payload.difficultyScore ?? null,
        lastUpdated: payload.lastUpdated ? new Date(payload.lastUpdated) : null,
      },
    });
    await logAudit({
      entityType: "VisaRule",
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


