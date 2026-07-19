import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn, statusBadge, statusLabel, priorityBadge, priorityLabel, typeLabel } from "@/lib/utils";
import { Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import FilterForm from "@/components/tickets/FilterForm";

const PER_PAGE = 20;

interface Props { searchParams: { status?: string; priority?: string; type?: string; search?: string; department?: string; page?: string } }

export default async function AdminTicketsPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const where: any = {};
  if (searchParams.status)     where.status   = searchParams.status;
  if (searchParams.priority)   where.priority = searchParams.priority;
  if (searchParams.type)       where.type     = searchParams.type;
  if (searchParams.department) where.createdBy = { department: searchParams.department };
  if (searchParams.search) {
    where.OR = [
      { title:    { contains: searchParams.search } },
      { ticketNo: { contains: searchParams.search } },
    ];
  }

  // Fetch distinct departments for filter dropdown
  const deptGroups = await prisma.user.groupBy({
    by: ["department"],
    where: { department: { not: null } },
  });
  const departments = deptGroups.map(g => g.department!).filter(Boolean).sort();

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        createdBy:  { select: { name: true, department: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "#1F1535" }}>جميع التذاكر ({total})</h1>
      </div>

      {/* Filters — auto-submit on select change */}
      <FilterForm searchParams={searchParams} departments={departments} />

      {/* Table — desktop */}
      <div className="rounded-xl overflow-hidden border border-purple-100" style={{ background: "#FFFFFF" }}>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-purple-100">
          {tickets.length === 0 ? (
            <p className="text-center py-10 text-purple-500 text-sm">لا توجد تذاكر</p>
          ) : tickets.map(t => (
            <Link key={t.id} href={`/admin/tickets/${t.id}`}
              className="flex flex-col gap-2 p-4 hover:bg-purple-50 transition-colors block">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold" style={{ color: "#7C3AED" }}>{t.ticketNo}</span>
                <div className="flex gap-1">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", statusBadge[t.status])}>
                    {statusLabel[t.status]}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", priorityBadge[t.priority])}>
                    {priorityLabel[t.priority]}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium" style={{ color: "#1F1535" }}>{t.title}</p>
              <div className="flex items-center justify-between text-xs" style={{ color: "#7C6A9E" }}>
                <span>{t.createdBy.name} · {t.createdBy.department}</span>
                <span>{new Date(t.createdAt).toLocaleDateString("ar-SA", { calendar: "gregory" })}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "#F5F3FF", borderBottom: "2px solid #E9E3FF" }}>
              <tr>
                {["رقم التذكرة","العنوان","المُرسل / القسم","النوع","الأولوية","الحالة","المسند إلى","تاريخ الرفع",""].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-purple-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {tickets.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-purple-500">لا توجد تذاكر</td></tr>
              ) : tickets.map(t => (
                <tr key={t.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: "#7C3AED" }}>{t.ticketNo}</td>
                  <td className="px-4 py-3 max-w-xs"><p className="font-medium truncate" style={{ color: "#1F1535" }}>{t.title}</p></td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{t.createdBy.name}</p>
                    <p className="text-xs text-purple-500">{t.createdBy.department}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{typeLabel[t.type]}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", priorityBadge[t.priority])}>
                      {priorityLabel[t.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", statusBadge[t.status])}>
                      {statusLabel[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.assignedTo?.name || "—"}</td>
                  <td className="px-4 py-3 text-purple-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString("ar-SA", { calendar: "gregory" })}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/tickets/${t.id}`}
                      className="text-xs font-semibold hover:underline" style={{ color: "#7C3AED" }}>
                      عرض
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination total={total} page={page} perPage={PER_PAGE} />
        </div>
      </div>
    </div>
  );
}
