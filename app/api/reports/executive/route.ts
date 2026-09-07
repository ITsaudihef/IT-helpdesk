import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRIORITY_KEYS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "CEO" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      color: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { department: true } },
      _count: { select: { members: true } },
      columns: {
        select: {
          title: true,
          order: true,
          cards: { select: { priority: true, dueDate: true } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  let totalTasks = 0, doneTasks = 0, overdueTasks = 0;
  const openPriorityBreakdown: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  const deptMap: Record<string, {
    name: string;
    projectCount: number;
    overdueCount: number;
    totalTasks: number;
    doneTasks: number;
    progressSum: number;
    projects: any[];
  }> = {};

  let activeProjects = 0, overdueProjects = 0, upcomingProjects = 0, completedProjects = 0;
  let progressSum = 0;

  for (const p of projects) {
    const cardTotal = p.columns.reduce((sum, c) => sum + c.cards.length, 0);
    const lastColumn = p.columns[p.columns.length - 1];
    const cardDone = lastColumn ? lastColumn.cards.length : 0;
    const progressPct = cardTotal > 0 ? Math.round((cardDone / cardTotal) * 100) : 0;

    // Tasks not yet in the last ("done") column are considered open
    let projectOverdueTasks = 0;
    for (let i = 0; i < p.columns.length; i++) {
      const isLast = i === p.columns.length - 1;
      for (const card of p.columns[i].cards) {
        totalTasks++;
        if (isLast) { doneTasks++; continue; }
        openPriorityBreakdown[card.priority] = (openPriorityBreakdown[card.priority] || 0) + 1;
        if (card.dueDate && card.dueDate.getTime() < now) {
          overdueTasks++;
          projectOverdueTasks++;
        }
      }
    }

    const end = p.endDate ? p.endDate.getTime() : null;
    const start = p.startDate ? p.startDate.getTime() : null;
    let status: "متأخر" | "قادم" | "مكتمل" | "نشط" = "نشط";
    if (progressPct >= 100 && cardTotal > 0) status = "مكتمل";
    else if (end && now > end) status = "متأخر";
    else if (start && now < start) status = "قادم";

    if (status === "متأخر")      overdueProjects++;
    else if (status === "قادم")  upcomingProjects++;
    else if (status === "مكتمل") completedProjects++;
    else                          activeProjects++;

    progressSum += progressPct;

    const daysRemaining = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;

    const dept = p.createdBy.department || "غير محدد";
    if (!deptMap[dept]) {
      deptMap[dept] = { name: dept, projectCount: 0, overdueCount: 0, totalTasks: 0, doneTasks: 0, progressSum: 0, projects: [] };
    }
    deptMap[dept].projectCount++;
    deptMap[dept].totalTasks += cardTotal;
    deptMap[dept].doneTasks += cardDone;
    deptMap[dept].progressSum += progressPct;
    if (status === "متأخر") deptMap[dept].overdueCount++;

    deptMap[dept].projects.push({
      id: p.id,
      title: p.title,
      color: p.color,
      progressPct,
      cardTotal,
      cardDone,
      overdueTasks: projectOverdueTasks,
      columns: p.columns.map((c) => ({ title: c.title, count: c.cards.length })),
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      daysRemaining,
      status,
      memberCount: p._count.members,
      updatedAt: p.updatedAt.toISOString(),
    });
  }

  const STATUS_ORDER: Record<string, number> = { "متأخر": 0, "نشط": 1, "قادم": 2, "مكتمل": 3 };
  const departments = Object.values(deptMap)
    .map((d) => ({
      name: d.name,
      projectCount: d.projectCount,
      overdueCount: d.overdueCount,
      totalTasks: d.totalTasks,
      doneTasks: d.doneTasks,
      avgProgress: d.projectCount > 0 ? Math.round(d.progressSum / d.projectCount) : 0,
      projects: d.projects.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.progressPct - b.progressPct),
    }))
    .sort((a, b) => b.projectCount - a.projectCount);

  const monthMap: Record<string, number> = {};
  for (const p of projects) {
    if (p.createdAt < sixMonthsAgo) continue;
    const month = p.createdAt.toISOString().slice(0, 7);
    monthMap[month] = (monthMap[month] || 0) + 1;
  }
  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("ar-SA", { month: "short", year: "numeric", calendar: "gregory" }),
      count,
    }));

  return NextResponse.json({
    totalProjects: projects.length,
    activeProjects,
    overdueProjects,
    upcomingProjects,
    completedProjects,
    avgProgress: projects.length > 0 ? Math.round(progressSum / projects.length) : 0,
    totalTasks,
    doneTasks,
    overdueTasks,
    departmentCount: departments.length,
    openPriorityBreakdown,
    monthlyTrend,
    departments,
  });
}
