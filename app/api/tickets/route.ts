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
  } else if (session.user.role === "COMM_SUPPORT") {
    where.assignedToId = session.user.id;
    where.type = "INSTITUTIONAL_COMM";
  } else if (session.user.role === "COMM_ADMIN") {
    where.type = "INSTITUTIONAL_COMM";
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

  const needsApproval = requiresApproval || type === "INSTITUTIONAL_COMM";

  // For DEVELOPMENT tickets: route through dept manager first if one exists in the same department
  let initialStatus = needsApproval ? "PENDING_APPROVAL" : "OPEN";
  if (type === "DEVELOPMENT") {
    const creator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { department: true },
    });
    if (creator?.department) {
      const deptManager = await prisma.user.findFirst({
        where: { role: "DEPT_MANAGER", department: creator.department },
        select: { id: true },
      });
      if (deptManager) {
        initialStatus = "PENDING_DEPT_APPROVAL";
      }
    }
  }

  let ticket;
  let ticketNo = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    ticketNo = await generateTicketNo();
    try {
      ticket = await prisma.ticket.create({
        data: {
          ticketNo,
          title,
          description,
          type,
          priority: priority || "MEDIUM",
          requiresApproval: needsApproval,
          status: initialStatus,
          createdById: session.user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
      break;
    } catch (err: any) {
      if (err.code === "P2002" && attempt < 4) continue; // ticketNo collision — retry with a fresh number
      throw err;
    }
  }
  if (!ticket) {
    return NextResponse.json({ error: "تعذّر إنشاء رقم تذكرة فريد، حاول مجدداً" }, { status: 500 });
  }

  // Notify dept manager if ticket is routed to them
  const notifyDeptManager: Promise<any>[] = [];
  if (initialStatus === "PENDING_DEPT_APPROVAL") {
    const creator = await prisma.user.findUnique({ where: { id: session.user.id }, select: { department: true } });
    if (creator?.department) {
      const deptManagers = await prisma.user.findMany({
        where: { role: "DEPT_MANAGER", department: creator.department },
        select: { id: true },
      });
      deptManagers.forEach(dm => {
        notifyDeptManager.push(
          prisma.notification.create({
            data: { userId: dm.id, ticketId: ticket.id, message: `طلب تطوير جديد يحتاج اعتمادك: ${ticketNo}` },
          })
        );
      });
    }
  }

  await Promise.all([
    prisma.notification.create({
      data: { userId: session.user.id, ticketId: ticket.id, message: `تم إنشاء تذكرتك ${ticketNo} بنجاح` },
    }),
    logAudit(ticket.id, "إنشاء التذكرة", `بواسطة ${session.user.name}`, session.user.id),
    ...notifyDeptManager,
  ]);

  return NextResponse.json(ticket, { status: 201 });
}
