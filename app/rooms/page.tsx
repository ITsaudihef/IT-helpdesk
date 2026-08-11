import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoomTimeline from "@/components/rooms/RoomTimeline";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default async function RoomsPage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await auth();
  const today = new Date().toISOString().split("T")[0];
  const date  = searchParams.date || today;

  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.roomBooking.findMany({
      where: { date },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const serializedBookings = bookings.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#16241D" }}>حجز القاعات</h1>
          <p className="text-sm mt-0.5" style={{ color: "#5C7A6C" }}>اعرض التوفر واحجز قاعتك</p>
        </div>
        <Link href="/rooms/my"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "#F3F7F1", border: "1px solid #BFE0B6", color: "#007F5C" }}>
          <CalendarDays className="w-4 h-4" />
          حجوزاتي
        </Link>
      </div>

      <RoomTimeline
        rooms={rooms}
        bookings={serializedBookings as any}
        date={date}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
