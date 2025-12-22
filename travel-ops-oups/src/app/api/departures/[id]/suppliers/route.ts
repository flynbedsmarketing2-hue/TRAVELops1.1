import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/apiAuth";
import { handleApiError } from "../../../../../lib/apiResponse";
import { logAudit } from "../../../../../lib/audit";
import { getParams, RouteContext } from "../../../../../lib/routeParams";

const supplierInput = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  cost: z.number().int().optional(),
  deadline: z.string().optional(),
});

export async function POST(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = supplierInput.parse(await request.json());
    const departure = await prisma.departure.findUnique({ where: { id: id } });
    if (!departure) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const supplier = await prisma.supplier.upsert({
      where: { name: payload.name },
      update: {},
      create: { name: payload.name, type: "misc" },
    });

    const link = await prisma.supplierLink.create({
      data: {
        supplierId: supplier.id,
        departureId: departure.id,
        packageId: departure.packageId,
        notes: payload.contact ?? null,
        cost: payload.cost ?? null,
        deadline: payload.deadline ? new Date(payload.deadline) : null,
      },
      include: { supplier: true },
    });

    await logAudit({
      entityType: "SupplierLink",
      entityId: link.id,
      action: "create",
      actorId: session.user.id,
      afterJson: link,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await getParams(context.params);
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");
    if (!linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });
    const existing = await prisma.supplierLink.findUnique({ where: { id: linkId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.supplierLink.delete({ where: { id: linkId } });
    await logAudit({
      entityType: "SupplierLink",
      entityId: linkId,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}


