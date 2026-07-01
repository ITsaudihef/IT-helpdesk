import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; colId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, order } = await req.json();
  const col = await prisma.kanbanColumn.update({
    where: { id: params.colId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json(col);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; colId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.kanbanColumn.delete({ where: { id: params.colId } });
  return NextResponse.json({ ok: true });
}
