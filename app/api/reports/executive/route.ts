import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Ticket lifecycle buckets, for a coarse per-department workflow view
const IN_PROGRESS_SET = new Set([
  "OPEN", "IN_PROGRESS", "SCHEDULED", "WAITING_INFO",
  "PENDING_USER_TEST", "READY_TO_LAUNCH", "LAUNCHED", "APPROVED",
]);
const APPROVAL_SET = new Set(["PENDING_DEPT_APPROVAL", "PENDING_APPROVAL"]);
const DONE_SET      = new Set(["RESOLVED", "CLOSED"]);

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "CEO" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [tickets, monthlyTickets, projects] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        createdBy: { select: { department: true } },
      },
    }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        createdBy: { select: { department: true } },
        columns: {
          select: { order: true, _count: { select: { cards: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let total = 0;
  let critical = 0;
  let resolvedCount = 0;
  let totalResolutionMs = 0;
  const statusBreakdown: Record<string, number> = {};
  const deptMap: Record<string, {
    total: number; inProgress: number; pendingApproval: number; done: number; critical: number;
  }> = {};

  for (const t of tickets) {
    total++;
    statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;

    const isOpenCritical = t.priority === "CRITICAL" && !DONE_SET.has(t.status);
    if (isOpenCritical) critical++;

    if (t.resolvedAt) {
      resolvedCount++;
      totalResolutionMs += t.resolvedAt.getTime() - t.createdAt.getTime();
    }

    const dept = t.createdBy.department || "غير محدد";
    if (!deptMap[dept]) deptMap[dept] = { total: 0, inProgress: 0, pendingApproval: 0, done: 0, critical: 0 };
    deptMap[dept].total++;
    if (isOpenCritical) deptMap[dept].critical++;

    if (IN_PROGRESS_SET.has(t.status))      deptMap[dept].inProgress++;
    else if (APPROVAL_SET.has(t.status))    deptMap[dept].pendingApproval++;
    else if (DONE_SET.has(t.status))        deptMap[dept].done++;
  }

  const avgResolutionHours = resolvedCount > 0
    ? Math.round(totalResolutionMs / resolvedCount / (1000 * 60 * 60))
    : 0;

  const departments = Object.entries(deptMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total);

  // ── Project progress, grouped by department ──
  // A project's "done" stage is its right-most column (highest order) —
  // matches the default seeded columns (قيد الانتظار / قيد التنفيذ / مكتمل)
  // and holds for boards where users only ever add columns to the right.
  const now = Date.now();
  const projectDeptMap: Record<string, {
    name: string;
    projects: { id: string; title: string; progressPct: number; cardTotal: number; cardDone: number; startDate: string | null; endDate: string | null; status: "متأخر" | "قادم" | "نشط"; memberCount: number }[];
  }> = {};

  for (const p of projects) {
    const dept = p.createdBy.department || "غير محدد";
    if (!projectDeptMap[dept]) projectDeptMap[dept] = { name: dept, projects: [] };

    const cardTotal = p.columns.reduce((sum, c) => sum + c._count.cards, 0);
    const lastColumn = p.columns[p.columns.length - 1];
    const cardDone = lastColumn ? lastColumn._count.cards : 0;
    const progressPct = cardTotal > 0 ? Math.round((cardDone / cardTotal) * 100) : 0;

    const end = p.endDate ? p.endDate.getTime() : null;
    const start = p.startDate ? p.startDate.getTime() : null;
    let status: "متأخر" | "قادم" | "نشط" = "نشط";
    if (end && now > end && progressPct < 100) status = "متأخر";
    else if (start && now < start) status = "قادم";

    projectDeptMap[dept].projects.push({
      id: p.id,
      title: p.title,
      progressPct,
      cardTotal,
      cardDone,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      status,
      memberCount: p._count.members,
    });
  }

  const projectsByDepartment = Object.values(projectDeptMap)
    .map((d) => ({
      ...d,
      avgProgress: d.projects.length > 0
        ? Math.round(d.projects.reduce((s, p) => s + p.progressPct, 0) / d.projects.length)
        : 0,
    }))
    .sort((a, b) => b.projects.length - a.projects.length);

  const monthMap: Record<string, { created: number; resolved: number }> = {};
  for (const t of monthlyTickets) {
    const month = t.createdAt.toISOString().slice(0, 7);
    if (!monthMap[month]) monthMap[month] = { created: 0, resolved: 0 };
    monthMap[month].created++;
    if (t.status === "RESOLVED" || t.status === "CLOSED") monthMap[month].resolved++;
  }
  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + "-01").toLocaleDateString("ar-SA", { month: "short", year: "numeric", calendar: "gregory" }),
      ...v,
    }));

  return NextResponse.json({
    total,
    critical,
    avgResolutionHours,
    departmentCount: departments.length,
    statusBreakdown,
    departments,
    monthlyTrend,
    projectCount: projects.length,
    projectsByDepartment,
  });
}
