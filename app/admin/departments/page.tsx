import { prisma } from "@/lib/prisma";
import DepartmentsClient from "@/components/admin/DepartmentsClient";

export default async function AdminDepartmentsPage() {
  // All users with their department + role
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
    orderBy: { name: "asc" },
  });

  // Group by department
  const deptMap: Record<string, { employees: typeof users; managers: typeof users }> = {};

  for (const u of users) {
    const dept = u.department || "بدون قسم";
    if (!deptMap[dept]) deptMap[dept] = { employees: [], managers: [] };
    deptMap[dept].employees.push(u);
    if (u.role === "DEPT_MANAGER") deptMap[dept].managers.push(u);
  }

  const departments = Object.entries(deptMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#1F1535" }}>إدارة الأقسام</h1>
          <p className="text-sm text-purple-500 mt-0.5">تعيين مدراء الأقسام وإدارة موظفيها</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>
          {departments.length} قسم
        </div>
      </div>

      <DepartmentsClient departments={departments} allUsers={users as any} />
    </div>
  );
}
