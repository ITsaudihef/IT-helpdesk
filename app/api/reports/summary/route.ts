import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [total, byStatus, byType, critical, resolvedWithTime, ticketsForDept, monthlyTickets, staffStats] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.ticket.groupBy({ by: ["type"],   _count: { id: true } }),
      prisma.ticket.count({ where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      prisma.ticket.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
      // Department breakdown
      prisma.ticket.findMany({
        select: { createdBy: { select: { department: true } } },
      }),
      // Monthly trend — last 6 months
      prisma.ticket.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, status: true },
      }),
      // Staff performance (all time)
      prisma.ticket.findMany({
        where: { assignedToId: { not: null } },
        select: {
          assignedToId: true,
          assignedTo: { select: { name: true } },
          status: true,
          createdAt: true,
          resolvedAt: true,
        },
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

  // Department breakdown
  const deptMap: Record<string, number> = {};
  for (const t of ticketsForDept) {
    const dept = t.createdBy.department || "غير محدد";
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  }
  const departmentBreakdown = Object.entries(deptMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Monthly trend
  const monthMap: Record<string, { created: number; resolved: number }> = {};
  for (const t of monthlyTickets) {
    const month = t.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    if (!monthMap[month]) monthMap[month] = { created: 0, resolved: 0 };
    monthMap[month].created++;
    if (t.status === "RESOLVED" || t.status === "CLOSED") monthMap[month].resolved++;
  }
  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + "-01").toLocaleDateString("ar-SA", { month: "short", year: "numeric" }),
      ...v,
    }));

  // Staff performance table
  const agentMap: Record<string, { name: string; assigned: number; resolved: number; totalMs: number }> = {};
  for (const t of staffStats) {
    if (!t.assignedToId || !t.assignedTo) continue;
    if (!agentMap[t.assignedToId]) {
      agentMap[t.assignedToId] = { name: t.assignedTo.name, assigned: 0, resolved: 0, totalMs: 0 };
    }
    agentMap[t.assignedToId].assigned++;
    if ((t.status === "RESOLVED" || t.status === "CLOSED") && t.resolvedAt) {
      agentMap[t.assignedToId].resolved++;
      agentMap[t.assignedToId].totalMs += t.resolvedAt.getTime() - t.createdAt.getTime();
    }
  }
  const agentPerformance = Object.values(agentMap)
    .sort((a, b) => b.resolved - a.resolved)
    .map((a) => ({
      name: a.name,
      assigned: a.assigned,
      resolved: a.resolved,
      avgHours: a.resolved > 0 ? Math.round(a.totalMs / a.resolved / (1000 * 60 * 60)) : 0,
      rate: a.assigned > 0 ? Math.round((a.resolved / a.assigned) * 100) : 0,
    }));

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
    departmentBreakdown,
    monthlyTrend,
    agentPerformance,
    // legacy keys
    open:            sm["OPEN"]             || 0,
    inProgress:      sm["IN_PROGRESS"]      || 0,
    resolved:        (sm["RESOLVED"] || 0) + (sm["CLOSED"] || 0),
    pendingApproval: sm["PENDING_APPROVAL"] || 0,
  });
}
