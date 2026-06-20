import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendStatusNotification } from "@/lib/email";
import { statusLabel } from "@/lib/utils";

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

  if (status && status !== ticket.status) {
    await prisma.notification.create({
      data: {
        userId: ticket.createdById,
        ticketId: ticket.id,
        message: `تم تحديث حالة تذكرتك ${ticket.ticketNo} إلى: ${statusLabel[status] || status}`,
      },
    });

    if (ticket.createdBy.email) {
      await sendStatusNotification(
        ticket.createdBy.email,
        ticket.ticketNo,
        ticket.title,
        status,
        statusLabel[status] || status
      );
    }
  }

  return NextResponse.json(updated);
}
