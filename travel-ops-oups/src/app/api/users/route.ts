import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";

const userCreateSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["administrator", "travel_designer", "sales_agent", "viewer"]),
  fullName: z.string().optional(),
});

export async function GET() {
  try {
    await requireRole(["administrator", "travel_designer", "sales_agent", "viewer"]);
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role?.name ?? "viewer",
        fullName: user.name ?? "",
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator"]);
    const payload = userCreateSchema.parse(await request.json());
    const passwordHash = await hash(payload.password, 10);
    const role = await prisma.role.findUnique({ where: { name: payload.role } });
    const created = await prisma.user.create({
      data: {
        username: payload.username,
        name: payload.fullName,
        passwordHash,
        roleId: role?.id,
      },
    });
    await logAudit({
      entityType: "User",
      entityId: created.id,
      action: "create",
      actorId: session.user.id,
      afterJson: created,
    });
    return NextResponse.json(
      {
        id: created.id,
        username: created.username,
        role: payload.role,
        fullName: created.name ?? "",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
