import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [total, byStatus, byType, critical, resolvedWithTime] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.ticket.groupBy({ by: ["type"],   _count: { id: true } }),
    prisma.ticket.count({ where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.ticket.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
  ]);

  const sm: Record<string, number> = {};
  for (const r of byStatus) sm[r.status] = r._count.id;

  const tm: Record<string, number> = {};
  for (const r of byType) tm[r.type] = r._count.id;

  const avgResolutionTime = resolvedWithTime.length > 0
    ? resolvedWithTime.reduce((acc, t) => acc + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0)
      / resolvedWithTime.length / (1000 * 60 * 60)
    : 0;

  return NextResponse.json({
    total,
    critical,
    avgResolutionHours: Math.round(avgResolutionTime),
    statusBreakdown: {
      OPEN:             sm["OPEN"]             || 0,
      IN_PROGRESS:      sm["IN_PROGRESS"]      || 0,
      WAITING_INFO:     sm["WAITING_INFO"]     || 0,
      PENDING_APPROVAL: sm["PENDING_APPROVAL"] || 0,
      RESOLVED:         sm["RESOLVED"]         || 0,
      CLOSED:           sm["CLOSED"]           || 0,
    },
    typeBreakdown: {
      SUPPORT:       tm["SUPPORT"]       || 0,
      SHIFA_SUPPORT: tm["SHIFA_SUPPORT"] || 0,
      DEVELOPMENT:   tm["DEVELOPMENT"]   || 0,
    },
    // legacy keys
    open:            sm["OPEN"]             || 0,
    inProgress:      sm["IN_PROGRESS"]      || 0,
    resolved:        (sm["RESOLVED"] || 0) + (sm["CLOSED"] || 0),
    pendingApproval: sm["PENDING_APPROVAL"] || 0,
  });
}
