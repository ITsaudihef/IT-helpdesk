import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, capacity, features, location, isActive } = await req.json();
  const room = await prisma.room.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(capacity !== undefined && { capacity: parseInt(capacity) }),
      ...(features !== undefined && { features }),
      ...(location !== undefined && { location }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  return NextResponse.json(room);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const today = new Date().toISOString().split("T")[0];
  const futureBookings = await prisma.roomBooking.count({
    where: { roomId: params.id, date: { gte: today } },
  });
  if (futureBookings > 0) {
    return NextResponse.json(
      { error: `لا يمكن حذف القاعة — يوجد ${futureBookings} حجز مستقبلي` },
      { status: 400 }
    );
  }
  await prisma.room.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
