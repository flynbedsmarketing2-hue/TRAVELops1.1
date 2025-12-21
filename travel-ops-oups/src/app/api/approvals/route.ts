import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";

const approvalRequestSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const approvals = await prisma.approvalRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        decisions: { include: { decidedBy: true }, orderBy: { createdAt: "desc" } },
        requestedBy: true,
      },
    });
    return NextResponse.json(approvals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = approvalRequestSchema.parse(await request.json());
    const created = await prisma.approvalRequest.create({
      data: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        requestedById: session.user.id,
      },
    });
    await logAudit({
      entityType: "ApprovalRequest",
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
