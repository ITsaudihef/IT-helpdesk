import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";
import { canActOnTicket } from "@/lib/ticket-access";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body, isInternal } = await req.json();
  if (!body) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { department: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canActOnTicket({ id: session.user.id, role: session.user.role, department: session.user.department }, ticket)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const internalFlag = isInternal && (session.user.role === "ADMIN" || session.user.role === "SUPPORT");

  const comment = await prisma.comment.create({
    data: {
      ticketId: params.id,
      authorId: session.user.id,
      body,
      isInternal: internalFlag || false,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  if (!internalFlag && ticket.createdById !== session.user.id) {
    await createNotification({
      userId: ticket.createdById,
      ticketId: ticket.id,
      message: `تعليق جديد على تذكرتك ${ticket.ticketNo}`,
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
