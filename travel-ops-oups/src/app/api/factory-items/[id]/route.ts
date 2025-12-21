import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";
import { checkBriefReadiness } from "../../../../lib/factory";

const factoryItemUpdateSchema = z.object({
  title: z.string().optional(),
  stage: z.enum(["idea", "research", "brief", "build", "validation", "published"]).optional(),
  brief: z.record(z.any()).optional(),
  research: z.record(z.any()).optional(),
  linkedPackageId: z.string().optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const item = await prisma.factoryItem.findUnique({
      where: { id: id },
      include: { owner: true, linkedPackage: true },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = factoryItemUpdateSchema.parse(await request.json());
    const existing = await prisma.factoryItem.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextBrief = payload.brief ?? (existing.brief as Record<string, unknown> | null);
    const readiness = checkBriefReadiness(nextBrief);
    if (payload.stage && (payload.stage === "validation" || payload.stage === "published") && !readiness.ready) {
      return NextResponse.json({ error: "Brief not ready", issues: readiness.issues }, { status: 422 });
    }

    const updated = await prisma.factoryItem.update({
      where: { id: id },
      data: {
        title: payload.title ?? undefined,
        stage: payload.stage ?? undefined,
        brief: payload.brief ?? undefined,
        research: payload.research ?? undefined,
        linkedPackageId: payload.linkedPackageId ?? undefined,
        readinessIssues: readiness.ready ? null : readiness.issues,
      },
    });
    await logAudit({
      entityType: "FactoryItem",
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator"]);
    const existing = await prisma.factoryItem.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.factoryItem.delete({ where: { id: id } });
    await logAudit({
      entityType: "FactoryItem",
      entityId: id,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}


