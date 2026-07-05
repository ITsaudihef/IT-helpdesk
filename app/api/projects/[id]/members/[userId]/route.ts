import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProject } from "@/lib/project-access";

export async function DELETE(_: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  if (!canManageProject({ id: session.user.id, role: session.user.role }, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (params.userId === project.createdById) {
    return NextResponse.json({ error: "لا يمكن إزالة صاحب المشروع" }, { status: 400 });
  }

  await prisma.projectMember.deleteMany({ where: { projectId: params.id, userId: params.userId } });
  return NextResponse.json({ ok: true });
}
