import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectVisibilityWhere } from "@/lib/project-access";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, role } = session.user as any;
  const department = (session.user as any).department;

  const projects = await prisma.project.findMany({
    where: projectVisibilityWhere({ id, role, department }),
    orderBy: { createdAt: "desc" },
    take: 500, // safety cap; switch to real pagination if project volume grows past this
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { columns: true } },
      columns: {
        select: { _count: { select: { cards: true } } },
      },
    },
  });

  const result = projects.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    color: p.color,
    startDate: p.startDate?.toISOString() ?? null,
    endDate:   p.endDate?.toISOString()   ?? null,
    createdBy: p.createdBy,
    createdAt: p.createdAt.toISOString(),
    columnCount: p._count.columns,
    cardCount: p.columns.reduce((sum, col) => sum + col._count.cards, 0),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, color, startDate, endDate } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      color: color || "#7C3AED",
      startDate: startDate ? new Date(startDate) : null,
      endDate:   endDate   ? new Date(endDate)   : null,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });

  // Seed default columns
  await prisma.kanbanColumn.createMany({
    data: [
      { projectId: project.id, title: "قيد الانتظار", order: 0 },
      { projectId: project.id, title: "قيد التنفيذ",  order: 1 },
      { projectId: project.id, title: "مكتمل",        order: 2 },
    ],
  });

  // Creator is automatically a team member
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: session.user.id },
  });

  return NextResponse.json({
    ...project,
    startDate: project.startDate?.toISOString() ?? null,
    endDate:   project.endDate?.toISOString()   ?? null,
    createdAt: project.createdAt.toISOString(),
  }, { status: 201 });
}
