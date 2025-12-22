import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/apiAuth";
import { handleApiError } from "../../../../../lib/apiResponse";
import { logAudit } from "../../../../../lib/audit";
import { getParams, RouteContext } from "../../../../../lib/routeParams";

const costLineInput = z.object({
  label: z.string().min(1),
  amount: z.number().int().min(0),
  dueDate: z.string().optional(),
  paid: z.boolean().optional(),
});

export async function POST(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = costLineInput.parse(await request.json());
    const departure = await prisma.departure.findUnique({ where: { id: id } });
    if (!departure) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const line = await prisma.costLine.create({
      data: {
        departureId: departure.id,
        packageId: departure.packageId,
        type: "misc",
        label: payload.label,
        amount: payload.amount,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        paid: payload.paid ?? false,
      },
    });

    await logAudit({
      entityType: "CostLine",
      entityId: line.id,
      action: "create",
      actorId: session.user.id,
      afterJson: line,
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = (await request.json()) as {
      id?: string;
      label?: string;
      amount?: number;
      dueDate?: string | null;
      paid?: boolean;
    };
    if (!payload.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const existing = await prisma.costLine.findUnique({ where: { id: payload.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.costLine.update({
      where: { id: payload.id },
      data: {
        label: payload.label ?? undefined,
        amount: payload.amount ?? undefined,
        dueDate: payload.dueDate === null ? null : payload.dueDate ? new Date(payload.dueDate) : undefined,
        paid: payload.paid ?? undefined,
      },
    });
    await logAudit({
      entityType: "CostLine",
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get("lineId");
    if (!lineId) return NextResponse.json({ error: "lineId required" }, { status: 400 });
    const existing = await prisma.costLine.findUnique({ where: { id: lineId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.costLine.delete({ where: { id: lineId } });
    await logAudit({
      entityType: "CostLine",
      entityId: lineId,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}


