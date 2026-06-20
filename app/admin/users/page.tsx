import { prisma } from "@/lib/prisma";
import UsersClient from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
      _count: { select: { ticketsCreated: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">إدارة المستخدمين</h1>
      <UsersClient initialUsers={users as any} />
    </div>
  );
}
