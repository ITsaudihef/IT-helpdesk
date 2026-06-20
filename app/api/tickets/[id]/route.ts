import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendStatusNotification } from "@/lib/email";
import { statusLabel } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, department: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        where: session.user.role === "USER" ? { isInternal: false } : {},
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "USER" && ticket.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, assignedToId, priority, rating, title, description } = body;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { createdBy: true },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: any = {};

  if (status && (session.user.role === "ADMIN" || session.user.role === "SUPPORT")) {
    updateData.status = status;
    if (status === "RESOLVED") updateData.resolvedAt = new Date();
  }

  if (assignedToId !== undefined && (session.user.role === "ADMIN" || session.user.role === "SUPPORT")) {
    updateData.assignedToId = assignedToId;
  }

  if (priority && session.user.role === "ADMIN") {
    updateData.priority = priority;
  }

  if (rating && session.user.role === "USER" && ticket.createdById === session.user.id) {
    updateData.rating = rating;
  }

  if (title && session.user.role === "ADMIN") updateData.title = title;
  if (description && session.user.role === "ADMIN") updateData.description = description;

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  const auditTasks: Promise<any>[] = [];

  if (status && status !== ticket.status) {
    const label = statusLabel[status] || status;
    auditTasks.push(
      prisma.notification.create({
        data: {
          userId: ticket.createdById,
          ticketId: ticket.id,
          message: `تم تحديث حالة تذكرتك ${ticket.ticketNo} إلى: ${label}`,
        },
      }),
      logAudit(ticket.id, "تغيير الحالة", `من "${statusLabel[ticket.status] || ticket.status}" إلى "${label}"`, session.user.id)
    );
    if (ticket.createdBy.email) {
      auditTasks.push(sendStatusNotification(ticket.createdBy.email, ticket.ticketNo, ticket.title, status, label));
    }
  }

  if (assignedToId !== undefined && assignedToId !== ticket.assignedToId) {
    const assignee = assignedToId
      ? await prisma.user.findUnique({ where: { id: assignedToId }, select: { name: true } })
      : null;
    auditTasks.push(
      logAudit(ticket.id, "تغيير التكليف", assignee ? `تم التكليف إلى ${assignee.name}` : "تم إلغاء التكليف", session.user.id)
    );
  }

  if (priority && priority !== ticket.priority) {
    auditTasks.push(logAudit(ticket.id, "تغيير الأولوية", `إلى "${priority}"`, session.user.id));
  }

  if (rating) {
    auditTasks.push(logAudit(ticket.id, "تقييم التذكرة", `${rating} نجوم`, session.user.id));
  }

  if (auditTasks.length) await Promise.all(auditTasks);

  return NextResponse.json(updated);
}
