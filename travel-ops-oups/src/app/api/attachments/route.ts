import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { storageService } from "../../../lib/storage";
import { logAudit } from "../../../lib/audit";

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer", "sales_agent"]);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: "file, entityType, entityId required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storageService.saveFile(buffer, file.name, file.type);

    const attachment = await prisma.attachment.create({
      data: {
        entityType,
        entityId,
        fileName: stored.fileName,
        filePath: stored.filePath,
        mimeType: stored.mimeType ?? null,
        size: stored.size,
        uploadedById: session.user.id,
      },
    });

    await logAudit({
      entityType: "Attachment",
      entityId: attachment.id,
      action: "create",
      actorId: session.user.id,
      afterJson: attachment,
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
