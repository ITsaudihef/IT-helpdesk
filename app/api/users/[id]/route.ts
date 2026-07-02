import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role, department } = await req.json();
  const updateData: any = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (department !== undefined) updateData.department = department;
  if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, department: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [ticketsCreated, comments, roomBookings, projectsCreated, cardsCreated, memberships] = await Promise.all([
    prisma.ticket.count({ where: { createdById: params.id } }),
    prisma.comment.count({ where: { authorId: params.id } }),
    prisma.roomBooking.count({ where: { userId: params.id } }),
    prisma.project.count({ where: { createdById: params.id } }),
    prisma.kanbanCard.count({ where: { createdById: params.id } }),
    prisma.projectMember.count({ where: { userId: params.id } }),
  ]);

  if (ticketsCreated || comments || roomBookings || projectsCreated || cardsCreated || memberships) {
    return NextResponse.json(
      { error: "لا يمكن حذف هذا المستخدم لأن لديه نشاطاً سابقاً (تذاكر أو تعليقات أو مشاريع أو حجوزات). عدّل دوره أو صلاحياته بدلاً من الحذف." },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
