import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; cardId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { columnId, title, description, priority, assigneeId, dueDate, order } = body;

  const updated = await prisma.kanbanCard.update({
    where: { id: params.cardId },
    data: {
      ...(columnId    !== undefined && { columnId }),
      ...(title       !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(priority    !== undefined && { priority }),
      ...(assigneeId  !== undefined && { assigneeId: assigneeId || null }),
      ...(dueDate     !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(order       !== undefined && { order }),
    },
    include: {
      assignee:  { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });

  // Assigning a card automatically makes the assignee a visible team member
  if (assigneeId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: params.id, userId: assigneeId } },
      update: {},
      create: { projectId: params.id, userId: assigneeId },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; cardId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.kanbanCard.delete({ where: { id: params.cardId } });
  return NextResponse.json({ ok: true });
}
