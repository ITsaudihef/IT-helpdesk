import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, capacity, features, location } = await req.json();
  if (!name || !capacity) {
    return NextResponse.json({ error: "الاسم والسعة مطلوبان" }, { status: 400 });
  }
  const room = await prisma.room.create({
    data: { name, capacity: parseInt(capacity), features: features || "", location: location || null },
  });
  return NextResponse.json(room);
}
