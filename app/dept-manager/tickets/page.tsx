import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn, statusBadge, statusLabel, priorityBadge, priorityLabel } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";

const PER_PAGE = 20;

interface Props { searchParams: { status?: string; page?: string } }

export default async function DeptManagerTicketsPage({ searchParams }: Props) {
  const session = await auth();
  const dept = session!.user.department as string;
  const page = Math.max(1, parseInt(searchParams.page || "1"));

  const where: any = {
    type: "DEVELOPMENT",
    createdBy: { department: dept },
  };
  if (searchParams.status) where.status = searchParams.status;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { createdBy: { select: { name: true, department: true } } },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.ticket.count({ where }),
  ]);

  const STATUS_TABS = [
    { label: "الكل",              value: "" },
    { label: "بانتظار اعتمادك",   value: "PENDING_DEPT_APPROVAL" },
    { label: "بانتظار التقنية",   value: "PENDING_APPROVAL" },
    { label: "قيد المعالجة",      value: "IN_PROGRESS" },
    { label: "اختبار قبل الإطلاق", value: "PENDING_USER_TEST" },
    { label: "محلولة",            value: "RESOLVED" },
    { label: "مُعادة",            value: "OPEN" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "#1F1535" }}>
          طلبات تطوير القسم ({total})
        </h1>
        <p className="text-sm text-purple-500">القسم: {dept}</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => {
          const active = (searchParams.status || "") === tab.value;
          const href = tab.value ? `/dept-manager/tickets?status=${tab.value}` : "/dept-manager/tickets";
          return (
            <Link key={tab.value} href={href}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={active
                ? { background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "#fff" }
                : { background: "#FFFFFF", color: "#7C3AED", border: "1px solid #D1C4FE" }}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl overflow-hidden border border-purple-100" style={{ background: "#FFFFFF" }}>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-purple-100">
          {tickets.length === 0 ? (
            <p className="text-center py-10 text-purple-500 text-sm">لا توجد طلبات</p>
          ) : tickets.map(t => (
            <Link key={t.id} href={`/dept-manager/tickets/${t.id}`}
              className="flex flex-col gap-2 p-4 hover:bg-purple-50 transition-colors block">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold" style={{ color: "#7C3AED" }}>{t.ticketNo}</span>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#1F1535" }}>{t.title}</p>
              <div className="flex items-center justify-between text-xs" style={{ color: "#7C6A9E" }}>
                <span>{t.createdBy.name}</span>
                <span>{new Date(t.createdAt).toLocaleDateString("ar-SA")}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "#F5F3FF", borderBottom: "2px solid #E9E3FF" }}>
              <tr>
                {["رقم التذكرة","العنوان","المُرسل","الأولوية","الحالة","تاريخ الرفع",""].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-purple-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {tickets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-purple-500">لا توجد طلبات</td></tr>
              ) : tickets.map(t => (
                <tr key={t.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: "#7C3AED" }}>{t.ticketNo}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium truncate" style={{ color: "#1F1535" }}>{t.title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.createdBy.name}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-purple-500 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dept-manager/tickets/${t.id}`}
                      className="text-xs font-semibold hover:underline" style={{ color: "#7C3AED" }}>
                      عرض
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
