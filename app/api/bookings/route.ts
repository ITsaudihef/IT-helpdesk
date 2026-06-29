import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const mine = searchParams.get("mine") === "true";

  const where: any = {};
  if (date) where.date = date;
  if (mine) where.userId = session.user.id;

  const bookings = await prisma.roomBooking.findMany({
    where,
    include: {
      room: { select: { id: true, name: true, capacity: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, title, date, startTime, endTime, notes } = await req.json();

  if (!roomId || !title || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  if (startTime >= endTime) {
    return NextResponse.json({ error: "وقت الانتهاء يجب أن يكون بعد وقت البداية" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return NextResponse.json({ error: "لا يمكن الحجز في تاريخ ماضٍ" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { id: roomId, isActive: true } });
  if (!room) return NextResponse.json({ error: "القاعة غير موجودة" }, { status: 404 });

  const conflict = await prisma.roomBooking.findFirst({
    where: {
      roomId,
      date,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: { user: { select: { name: true } } },
  });

  if (conflict) {
    return NextResponse.json({
      error: `القاعة محجوزة من ${conflict.startTime} إلى ${conflict.endTime} بواسطة ${conflict.user.name}`,
    }, { status: 409 });
  }

  const booking = await prisma.roomBooking.create({
    data: {
      roomId,
      userId: session.user.id,
      title,
      date,
      startTime,
      endTime,
      notes: notes || null,
    },
    include: {
      room: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  return NextResponse.json(booking);
}
