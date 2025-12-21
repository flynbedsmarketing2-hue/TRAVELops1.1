import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

const generateSchema = z.object({
  departureId: z.string().min(1),
  productType: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = generateSchema.parse(await request.json());
    const departure = await prisma.departure.findUnique({ where: { id: payload.departureId } });
    if (!departure || !departure.departureDate) {
      return NextResponse.json({ error: "Departure date required" }, { status: 400 });
    }

    const templates = await prisma.taskTemplate.findMany({
      where: payload.productType ? { productType: payload.productType } : undefined,
    });

    const created = await prisma.$transaction(
      templates.map((template) =>
        prisma.taskInstance.create({
          data: {
            templateId: template.id,
            departureId: departure.id,
            title: template.name,
            dueDate: new Date(
              new Date(departure.departureDate).getTime() - template.offsetDays * 24 * 60 * 60 * 1000
            ),
          },
        })
      )
    );

    await logAudit({
      entityType: "TaskInstance",
      entityId: departure.id,
      action: "generate",
      actorId: session.user.id,
      afterJson: created,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
