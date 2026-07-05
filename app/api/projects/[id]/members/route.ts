import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProject } from "@/lib/project-access";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  if (!canManageProject({ id: session.user.id, role: session.user.role }, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "المستخدم مطلوب" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId } },
  });

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: params.id, userId } },
    update: {},
    create: { projectId: params.id, userId },
  });

  if (!alreadyMember && userId !== session.user.id) {
    await createNotification({
      userId,
      projectId: project.id,
      message: `تمت إضافتك إلى فريق مشروع «${project.title}»`,
    });
  }

  return NextResponse.json({ ...member, user }, { status: 201 });
}
