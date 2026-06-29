import { prisma } from "@/lib/prisma";
import AdminRoomsClient from "@/components/admin/AdminRoomsClient";

export default async function AdminRoomsPage() {
  const today = new Date().toISOString().split("T")[0];

  const [rooms, recentBookings] = await Promise.all([
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.roomBooking.findMany({
      where: { date: { gte: today } },
      include: {
        room: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 50,
    }),
  ]);

  const serialize = (b: any) => ({ ...b, createdAt: b.createdAt.toISOString() });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "#1F1535" }}>إدارة القاعات</h1>
        <p className="text-sm mt-0.5" style={{ color: "#7C6A9E" }}>إضافة وتعديل وحذف القاعات ومتابعة الحجوزات</p>
      </div>
      <AdminRoomsClient
        initialRooms={rooms}
        initialBookings={recentBookings.map(serialize)}
      />
    </div>
  );
}
