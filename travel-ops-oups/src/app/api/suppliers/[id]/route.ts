import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

const supplierUpdateSchema = z.object({
  name: z.string().optional(),
  type: z.enum(["hotel", "transport", "airline", "dmc", "activity", "visa", "misc"]).optional(),
  terms: z.string().optional(),
  slaNotes: z.string().optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const supplier = await prisma.supplier.findUnique({
      where: { id: id },
      include: { contacts: true, links: true },
    });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = supplierUpdateSchema.parse(await request.json());
    const existing = await prisma.supplier.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.supplier.update({
      where: { id: id },
      data: {
        name: payload.name ?? undefined,
        type: payload.type ?? undefined,
        terms: payload.terms ?? undefined,
        slaNotes: payload.slaNotes ?? undefined,
      },
    });
    await logAudit({
      entityType: "Supplier",
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
    const existing = await prisma.supplier.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.supplier.delete({ where: { id: id } });
    await logAudit({
      entityType: "Supplier",
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


