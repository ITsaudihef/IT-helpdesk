import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn, statusBadge, statusLabel, priorityBadge, priorityLabel, typeLabel } from "@/lib/utils";
import { Search } from "lucide-react";

interface Props { searchParams: { status?: string; priority?: string; type?: string; search?: string } }

export default async function AdminTicketsPage({ searchParams }: Props) {
  const where: any = {};
  if (searchParams.status)   where.status   = searchParams.status;
  if (searchParams.priority) where.priority = searchParams.priority;
  if (searchParams.type)     where.type     = searchParams.type;
  if (searchParams.search) {
    where.OR = [
      { title:    { contains: searchParams.search } },
      { ticketNo: { contains: searchParams.search } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      createdBy:  { select: { name: true, department: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">جميع التذاكر ({tickets.length})</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="search" defaultValue={searchParams.search}
              placeholder="بحث برقم أو عنوان التذكرة..."
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#6fb54a" } as any} />
          </div>
          {[
            { name:"status",   label:"الحالة",   opts: ["OPEN","IN_PROGRESS","PENDING_APPROVAL","WAITING_INFO","RESOLVED","CLOSED"] },
            { name:"priority", label:"الأولوية", opts: ["CRITICAL","HIGH","MEDIUM","LOW"] },
            { name:"type",     label:"النوع",    opts: ["SUPPORT","SHIFA_SUPPORT","DEVELOPMENT"] },
          ].map(f => (
            <select key={f.name} name={f.name} defaultValue={(searchParams as any)[f.name] || ""}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#6fb54a" } as any}>
              <option value="">كل {f.label}</option>
              {f.opts.map(o => (
                <option key={o} value={o}>{statusLabel[o] || priorityLabel[o] || typeLabel[o] || o}</option>
              ))}
            </select>
          ))}
          <button type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#6fb54a" }}>
            بحث
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "#f4f4f5" }}>
              <tr>
                {["رقم التذكرة","العنوان","المُرسل / القسم","النوع","الأولوية","الحالة","المسند إلى","تاريخ الرفع",""].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">لا توجد تذاكر</td></tr>
              ) : tickets.map(t => (
                <tr key={t.id} className="hover:bg-green-50/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: "#6fb54a" }}>{t.ticketNo}</td>
                  <td className="px-4 py-3 max-w-xs"><p className="font-medium text-gray-900 truncate">{t.title}</p></td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{t.createdBy.name}</p>
                    <p className="text-xs text-gray-400">{t.createdBy.department}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{typeLabel[t.type]}</td>
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
                  <td className="px-4 py-3 text-gray-600">{t.assignedTo?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString("ar-SA")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/tickets/${t.id}`}
                      className="text-xs font-semibold hover:underline" style={{ color: "#6fb54a" }}>
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
