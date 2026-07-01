import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
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
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    columnCount: p._count.columns,
    cardCount: p.columns.reduce((sum, col) => sum + col._count.cards, 0),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, color } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      color: color || "#7C3AED",
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

  return NextResponse.json(project, { status: 201 });
}
