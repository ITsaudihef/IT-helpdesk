import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly";

  const now = new Date();
  let startDate: Date;
  let groupFormat: string;

  if (period === "weekly") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "quarterly") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: startDate } },
    select: {
      createdAt: true,
      status: true,
      type: true,
      priority: true,
      resolvedAt: true,
      assignedToId: true,
      assignedTo: { select: { name: true } },
    },
  });

  const dailyMap: Record<string, { created: number; resolved: number }> = {};
  const typeMap: Record<string, number> = {};
  const priorityMap: Record<string, number> = {};
  const staffMap: Record<string, { name: string; resolved: number; totalTime: number; count: number }> = {};

  for (const t of tickets) {
    const day = t.createdAt.toISOString().split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { created: 0, resolved: 0 };
    dailyMap[day].created++;
    if (t.status === "RESOLVED" || t.status === "CLOSED") {
      dailyMap[day].resolved++;
    }

    typeMap[t.type] = (typeMap[t.type] || 0) + 1;
    priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;

    if (t.assignedToId && t.assignedTo) {
      if (!staffMap[t.assignedToId]) {
        staffMap[t.assignedToId] = { name: t.assignedTo.name, resolved: 0, totalTime: 0, count: 0 };
      }
      if ((t.status === "RESOLVED" || t.status === "CLOSED") && t.resolvedAt) {
        staffMap[t.assignedToId].resolved++;
        staffMap[t.assignedToId].totalTime += t.resolvedAt.getTime() - t.createdAt.getTime();
        staffMap[t.assignedToId].count++;
      }
    }
  }

  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(priorityMap).map(([name, value]) => ({ name, value }));
  const staffData = Object.values(staffMap).map((s) => ({
    name: s.name,
    resolved: s.resolved,
    avgHours: s.count > 0 ? Math.round(s.totalTime / s.count / (1000 * 60 * 60)) : 0,
  }));

  return NextResponse.json({ dailyData, typeData, priorityData, staffData });
}
