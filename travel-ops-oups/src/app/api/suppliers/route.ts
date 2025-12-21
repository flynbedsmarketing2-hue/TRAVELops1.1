import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";

const supplierSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["hotel", "transport", "airline", "dmc", "activity", "visa", "misc"]),
  terms: z.string().optional(),
  slaNotes: z.string().optional(),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { contacts: true, links: true },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer"]);
    const payload = supplierSchema.parse(await request.json());
    const created = await prisma.supplier.create({
      data: {
        name: payload.name,
        type: payload.type,
        terms: payload.terms ?? null,
        slaNotes: payload.slaNotes ?? null,
        contacts: payload.contacts
          ? {
              create: payload.contacts.map((contact) => ({
                name: contact.name,
                email: contact.email ?? null,
                phone: contact.phone ?? null,
                role: contact.role ?? null,
              })),
            }
          : undefined,
      },
      include: { contacts: true },
    });
    await logAudit({
      entityType: "Supplier",
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
