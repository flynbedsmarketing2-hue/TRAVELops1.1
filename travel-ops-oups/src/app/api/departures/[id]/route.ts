import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const departure = await prisma.departure.findUnique({
      where: { id: id },
      include: {
        supplierLinks: { include: { supplier: true } },
        costLines: true,
        timelineItems: true,
      },
    });
    if (!departure) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(departure);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = (await request.json()) as {
      status?: "pending_validation" | "validated";
      validationDate?: string | null;
    };
    const existing = await prisma.departure.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.departure.update({
      where: { id: id },
      data: {
        status: payload.status ?? undefined,
        validationDate:
          payload.status === "validated"
            ? new Date()
            : payload.validationDate === null
              ? null
              : undefined,
      },
    });
    await logAudit({
      entityType: "Departure",
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


