import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

async function generateTicketNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ticket.count();
  const seq = String(count + 1).padStart(5, "0");
  return `IT-${year}-${seq}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");
  const assignedTo = searchParams.get("assignedTo");
  const search = searchParams.get("search");

  const where: any = {};

  if (session.user.role === "USER") {
    where.createdById = session.user.id;
  } else if (session.user.role === "SUPPORT") {
    where.assignedToId = session.user.id;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (type) where.type = type;
  if (assignedTo) where.assignedToId = assignedTo;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { ticketNo: { contains: search } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true, department: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, type, priority, requiresApproval } = body;

  if (!title || !description || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ticketNo = await generateTicketNo();

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo,
      title,
      description,
      type,
      priority: priority || "MEDIUM",
      requiresApproval: requiresApproval || false,
      status: requiresApproval ? "PENDING_APPROVAL" : "OPEN",
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await Promise.all([
    prisma.notification.create({
      data: { userId: session.user.id, ticketId: ticket.id, message: `تم إنشاء تذكرتك ${ticketNo} بنجاح` },
    }),
    logAudit(ticket.id, "إنشاء التذكرة", `بواسطة ${session.user.name}`, session.user.id),
  ]);

  return NextResponse.json(ticket, { status: 201 });
}
