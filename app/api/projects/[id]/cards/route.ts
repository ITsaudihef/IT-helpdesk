import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { columnId, title, description, priority, assigneeId, dueDate } = await req.json();
  if (!columnId || !title?.trim()) {
    return NextResponse.json({ error: "العمود والعنوان مطلوبان" }, { status: 400 });
  }

  const column = await prisma.kanbanColumn.findUnique({ where: { id: columnId } });
  if (!column || column.projectId !== params.id) {
    return NextResponse.json({ error: "العمود غير موجود" }, { status: 404 });
  }

  const maxOrder = await prisma.kanbanCard.aggregate({
    where: { columnId },
    _max: { order: true },
  });

  const card = await prisma.kanbanCard.create({
    data: {
      columnId,
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "MEDIUM",
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? -1) + 1,
      createdById: session.user.id,
    },
    include: {
      assignee:  { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(card, { status: 201 });
}
