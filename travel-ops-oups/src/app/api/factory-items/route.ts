import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";
import { checkBriefReadiness } from "../../../lib/factory";

const factoryItemSchema = z.object({
  title: z.string().min(1),
  stage: z.enum(["idea", "research", "brief", "build", "validation", "published"]).default("idea"),
  brief: z.record(z.any()).optional(),
  research: z.record(z.any()).optional(),
  linkedPackageId: z.string().optional(),
});

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const items = await prisma.factoryItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: true, linkedPackage: true },
    });
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = factoryItemSchema.parse(await request.json());
    const readiness = checkBriefReadiness(payload.brief ?? null);
    const created = await prisma.factoryItem.create({
      data: {
        title: payload.title,
        stage: payload.stage,
        brief: payload.brief ?? undefined,
        research: payload.research ?? undefined,
        linkedPackageId: payload.linkedPackageId ?? null,
        ownerId: session.user.id,
        readinessIssues: readiness.ready ? null : readiness.issues,
      },
    });
    await logAudit({
      entityType: "FactoryItem",
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
