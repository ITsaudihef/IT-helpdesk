import { prisma } from "@/lib/prisma";

export async function logAudit(
  ticketId: string,
  action: string,
  detail?: string,
  actorId?: string
) {
  await prisma.auditLog.create({
    data: { ticketId, action, detail: detail ?? null, actorId: actorId ?? null },
  });
}
