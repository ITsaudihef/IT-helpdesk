import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MyBookingsClient from "@/components/rooms/MyBookingsClient";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function MyBookingsPage() {
  const session = await auth();
  const today   = new Date().toISOString().split("T")[0];

  const [upcoming, past] = await Promise.all([
    prisma.roomBooking.findMany({
      where: { userId: session!.user.id, date: { gte: today } },
      include: { room: { select: { name: true, location: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.roomBooking.findMany({
      where: { userId: session!.user.id, date: { lt: today } },
      include: { room: { select: { name: true, location: true } } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 20,
    }),
  ]);

  const serialize = (b: any) => ({ ...b, createdAt: b.createdAt.toISOString() });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/rooms"
          className="p-2 rounded-xl hover:bg-purple-100 transition-colors"
          style={{ color: "#7C3AED" }}>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#1F1535" }}>حجوزاتي</h1>
          <p className="text-sm" style={{ color: "#7C6A9E" }}>إدارة حجوزات القاعات</p>
        </div>
      </div>

      <MyBookingsClient
        upcoming={upcoming.map(serialize)}
        past={past.map(serialize)}
      />
    </div>
  );
}
