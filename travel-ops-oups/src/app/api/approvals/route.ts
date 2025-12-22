import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";
import { getParams } from "../../../lib/routeParams";

// simple runtime validation to avoid depending on 'zod' types
const isValidStatus = (s: any): s is "approved" | "rejected" =>
  s === "approved" || s === "rejected";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await getParams(params);
    const session = await requireRole(["administrator"]);
    const body = await request.json().catch(() => ({}));
    const payload = {
      status: body?.status,
      comment: body?.comment,
    };
    if (!isValidStatus(payload.status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const existing = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

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

    return new Response(JSON.stringify({ request: updated, decision }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return handleApiError(error);
  }
}
