import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/apiAuth";
import { handleApiError } from "../../../../../lib/apiResponse";
import { logAudit } from "../../../../../lib/audit";
import { getParams, RouteContext } from "../../../../../lib/routeParams";

const timelineInput = z.object({
  title: z.string().min(1),
  date: z.string().optional(),
  note: z.string().optional(),
  kind: z.string().optional(),
});

export async function POST(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = timelineInput.parse(await request.json());
    const departure = await prisma.departure.findUnique({ where: { id: id } });
    if (!departure) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await prisma.opsTimelineItem.create({
      data: {
        departureId: departure.id,
        title: payload.title,
        date: payload.date ? new Date(payload.date) : null,
        note: payload.note ?? null,
        kind: payload.kind ?? null,
      },
    });

    await logAudit({
      entityType: "OpsTimelineItem",
      entityId: item.id,
      action: "create",
      actorId: session.user.id,
      afterJson: item,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = (await request.json()) as {
      id?: string;
      title?: string;
      date?: string | null;
      note?: string | null;
      kind?: string | null;
    };
    if (!payload.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const existing = await prisma.opsTimelineItem.findUnique({ where: { id: payload.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.opsTimelineItem.update({
      where: { id: payload.id },
      data: {
        title: payload.title ?? undefined,
        date: payload.date === null ? null : payload.date ? new Date(payload.date) : undefined,
        note: payload.note === null ? null : payload.note ?? undefined,
        kind: payload.kind === null ? null : payload.kind ?? undefined,
      },
    });

    await logAudit({
      entityType: "OpsTimelineItem",
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
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
    const existing = await prisma.opsTimelineItem.findUnique({ where: { id: itemId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.opsTimelineItem.delete({ where: { id: itemId } });
    await logAudit({
      entityType: "OpsTimelineItem",
      entityId: itemId,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}


