import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, note } = await req.json();
  if (!["pass", "fail"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "fail" && !note?.trim()) {
    return NextResponse.json({ error: "يرجى كتابة وصف المشكلة" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden — not your ticket" }, { status: 403 });
  }
  if (ticket.status !== "PENDING_USER_TEST") {
    return NextResponse.json({ error: "Ticket is not pending user test" }, { status: 400 });
  }

  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: "IN_PROGRESS", updatedAt: new Date() },
  });

  const tasks: Promise<any>[] = [
    logAudit(
      params.id,
      action === "pass" ? "اجتياز اختبار المستخدم" : "فشل اختبار المستخدم",
      action === "pass"
        ? `أكّد ${ticket.createdBy.name} نجاح الاختبار، أُعيدت التذكرة لتقنية المعلومات للإطلاق`
        : `أبلغ ${ticket.createdBy.name} عن مشكلة: ${note}`,
      session.user.id
    ),
  ];

  if (action === "fail") {
    tasks.push(
      prisma.comment.create({
        data: {
          ticketId: params.id,
          authorId: session.user.id,
          body: `**نتيجة اختبار المستخدم — فشل:**\n${note}`,
          isInternal: false,
        },
      })
    );
  }

  if (ticket.assignedToId) {
    tasks.push(
      createNotification({
        userId: ticket.assignedToId,
        ticketId: ticket.id,
        message:
          action === "pass"
            ? `${ticket.createdBy.name} أكّد نجاح اختبار التذكرة ${ticket.ticketNo} — جاهزة للإطلاق`
            : `${ticket.createdBy.name} أبلغ عن مشكلة في اختبار التذكرة ${ticket.ticketNo}: ${note}`,
      })
    );
  }

  await Promise.all(tasks);

  return NextResponse.json({ success: true });
}
