import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });

  const maxOrder = await prisma.kanbanColumn.aggregate({
    where: { projectId: params.id },
    _max: { order: true },
  });

  const col = await prisma.kanbanColumn.create({
    data: {
      projectId: params.id,
      title: title.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(col, { status: 201 });
}
