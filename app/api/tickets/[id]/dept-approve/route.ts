import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "DEPT_MANAGER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, note } = await req.json();
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { id: true, name: true, department: true } } },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.status !== "PENDING_DEPT_APPROVAL") {
    return NextResponse.json({ error: "Ticket is not pending dept approval" }, { status: 400 });
  }

  const dept = (session.user as any).department;
  if (role === "DEPT_MANAGER" && ticket.createdBy.department !== dept) {
    return NextResponse.json({ error: "Forbidden — not your department" }, { status: 403 });
  }

  if (action === "approve") {
    await prisma.ticket.update({
      where: { id: params.id },
      data: { status: "PENDING_APPROVAL", updatedAt: new Date() },
    });

    await Promise.all([
      logAudit(params.id, "اعتماد مدير القسم", `اعتمد ${session.user.name} الطلب وأُرسل للفريق التقني`, session.user.id),
      createNotification({
        userId: ticket.createdBy.id,
        ticketId: ticket.id,
        message: `تم اعتماد طلبك ${ticket.ticketNo} من مدير القسم وهو الآن بانتظار اعتماد الفريق التقني`,
      }),
    ]);
  } else {
    // reject → return to OPEN with a comment and audit note
    await prisma.ticket.update({
      where: { id: params.id },
      data: { status: "OPEN", requiresApproval: false, updatedAt: new Date() },
    });

    await Promise.all([
      logAudit(params.id, "إعادة من مدير القسم", note || "تم إعادة الطلب من مدير القسم", session.user.id),
      ...(note
        ? [prisma.comment.create({
            data: {
              ticketId: ticket.id,
              authorId: session.user.id,
              body: `**إعادة الطلب من مدير القسم:**\n${note}`,
              isInternal: false,
            },
          })]
        : []),
      createNotification({
        userId: ticket.createdBy.id,
        ticketId: ticket.id,
        message: `تم إعادة طلبك ${ticket.ticketNo} من مدير القسم${note ? `: ${note}` : ""}`,
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}
