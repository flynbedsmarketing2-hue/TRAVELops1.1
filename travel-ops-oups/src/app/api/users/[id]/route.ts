import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/apiAuth";
import { handleApiError } from "../../../../lib/apiResponse";
import { logAudit } from "../../../../lib/audit";

const userUpdateSchema = z.object({
  role: z.enum(["administrator", "travel_designer", "sales_agent", "viewer"]).optional(),
  fullName: z.string().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["administrator"]);
    const payload = userUpdateSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = payload.role ? await prisma.role.findUnique({ where: { name: payload.role } }) : null;
    const passwordHash = payload.password ? await hash(payload.password, 10) : undefined;
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: payload.fullName ?? undefined,
        roleId: payload.role ? role?.id : undefined,
        passwordHash,
      },
    });
    await logAudit({
      entityType: "User",
      entityId: updated.id,
      action: "update",
      actorId: session.user.id,
      beforeJson: existing,
      afterJson: updated,
    });
    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      role: payload.role ?? updated.roleId,
      fullName: updated.name ?? "",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["administrator"]);
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.user.delete({ where: { id: params.id } });
    await logAudit({
      entityType: "User",
      entityId: params.id,
      action: "delete",
      actorId: session.user.id,
      beforeJson: existing,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
