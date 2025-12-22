import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/apiAuth";
import { handleApiError } from "../../../../../lib/apiResponse";
import { logAudit } from "../../../../../lib/audit";
import { getParams, RouteContext } from "../../../../../lib/routeParams";

const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: RouteContext<{ id: string }>
) {
  try {
    const { id } = await getParams(context.params);
    const session = await requireRole(["administrator"]);
    const payload = decisionSchema.parse(await request.json());
    const existing = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const decision = await prisma.approvalDecision.create({
      data: {
        requestId: id,
        decidedById: session.user.id,
        status: payload.status,
        comment: payload.comment ?? null,
      },
    });

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: { status: payload.status },
    });

    await logAudit({
      entityType: "ApprovalDecision",
      entityId: decision.id,
      action: payload.status,
      actorId: session.user.id,
      afterJson: decision,
    });

    return NextResponse.json({ request: updated, decision });
  } catch (error) {
    return handleApiError(error);
  }
}
