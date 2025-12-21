import { prisma } from "./prisma";

type AuditPayload = {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export async function logAudit(payload: AuditPayload) {
  await prisma.auditLog.create({
    data: {
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      actorId: payload.actorId ?? null,
      beforeJson: payload.beforeJson ?? undefined,
      afterJson: payload.afterJson ?? undefined,
    },
  });
}
