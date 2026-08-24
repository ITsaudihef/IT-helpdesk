import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendStatusNotification } from "@/lib/email";
import { statusLabel, formatDateShort } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";
import { canActOnTicket } from "@/lib/ticket-access";

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
  const { status, assignedToId, priority, rating, title, description, dueDate } = body;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { createdBy: true },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: any = {};

  const isStaff = ["ADMIN","SUPPORT","DEPT_MANAGER"].includes(session.user.role)
    && canActOnTicket(session.user, ticket);
  const isAdmin = session.user.role === "ADMIN";

  let autoAssignedId: string | null = null;

  if (status && isStaff) {
    // "SCHEDULED" is controlled only by admin or the assigned support agent —
    // isStaff already confirms a SUPPORT user is the assignee (via canActOnTicket),
    // so excluding DEPT_MANAGER here is the only extra check needed.
    const touchesScheduled = status === "SCHEDULED" || ticket.status === "SCHEDULED";
    const canControlScheduled = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
    if (touchesScheduled && !canControlScheduled) {
      return NextResponse.json({ error: "Forbidden — only admin or the assigned support agent can control the Scheduled status" }, { status: 403 });
    }
    updateData.status = status;
    if (status === "RESOLVED") updateData.resolvedAt = new Date();

    // Once the IT admin approves a ticket, route it automatically to whichever
    // support agent currently has the fewest open tickets — unless this same
    // request already assigns someone explicitly.
    if (status === "APPROVED" && !ticket.assignedToId && assignedToId === undefined) {
      const supportAgents = await prisma.user.findMany({
        where: { role: "SUPPORT" },
        select: {
          id: true,
          _count: { select: { ticketsAssigned: { where: { status: { notIn: ["RESOLVED", "CLOSED", "LAUNCHED"] } } } } },
        },
      });
      if (supportAgents.length > 0) {
        const leastBusy = supportAgents.reduce((min, u) =>
          u._count.ticketsAssigned < min._count.ticketsAssigned ? u : min
        );
        updateData.assignedToId = leastBusy.id;
        autoAssignedId = leastBusy.id;
      }
    }
  }

  if (assignedToId !== undefined && isStaff) {
    updateData.assignedToId = assignedToId;
  }

  if (priority && isAdmin) {
    updateData.priority = priority;
  }

  // Delivery date: set by admin or support only (not dept manager, not the requester)
  if (dueDate !== undefined && isStaff && session.user.role !== "DEPT_MANAGER") {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
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
      createNotification({
        userId: ticket.createdById,
        ticketId: ticket.id,
        message: `تم تحديث حالة تذكرتك ${ticket.ticketNo} إلى: ${label}`,
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

  if (autoAssignedId) {
    const assignee = await prisma.user.findUnique({ where: { id: autoAssignedId }, select: { name: true } });
    auditTasks.push(
      logAudit(ticket.id, "تكليف تلقائي", assignee ? `وُجّهت التذكرة تلقائياً إلى ${assignee.name} بعد الاعتماد` : "تكليف تلقائي بعد الاعتماد", session.user.id),
      createNotification({
        userId: autoAssignedId,
        ticketId: ticket.id,
        message: `تم إسناد تذكرة جديدة إليك تلقائياً بعد الاعتماد: ${ticket.ticketNo}`,
      })
    );
  }

  if (dueDate !== undefined && updateData.dueDate !== undefined) {
    const dueDateLabel = updateData.dueDate ? formatDateShort(updateData.dueDate) : "بدون تاريخ";
    auditTasks.push(
      logAudit(ticket.id, "تحديد تاريخ التسليم", dueDateLabel, session.user.id),
      createNotification({
        userId: ticket.createdById,
        ticketId: ticket.id,
        message: `تم تحديد تاريخ تسليم متوقع لتذكرتك ${ticket.ticketNo}: ${dueDateLabel}`,
      })
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
