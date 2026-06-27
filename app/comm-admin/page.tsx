import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";

export default async function CommAdminPage() {
  const pending = await prisma.ticket.findMany({
    where: { type: "INSTITUTIONAL_COMM", status: "PENDING_APPROVAL" },
    include: { createdBy: { select: { name: true, department: true } } },
    orderBy: { createdAt: "asc" },
  });

  const all = await prisma.ticket.count({ where: { type: "INSTITUTIONAL_COMM" } });
  const approved = await prisma.ticket.count({ where: { type: "INSTITUTIONAL_COMM", status: { in: ["IN_PROGRESS","RESOLVED","CLOSED"] } } });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "بانتظار الاعتماد", value: pending.length, color: "#d97706" },
          { label: "معتمدة / جارية",   value: approved,        color: "#22c55e" },
          { label: "الإجمالي",          value: all,             color: "#7C3AED" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 shadow-sm text-center" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-purple-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approval */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <h2 className="font-bold text-white">تذاكر التواصل المؤسسي — بانتظار الاعتماد</h2>
        </div>
        {pending.length === 0 ? (
          <p className="text-center text-purple-500 py-12 text-sm">لا توجد تذاكر بانتظار الاعتماد ✓</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {pending.map(t => (
              <li key={t.id}>
                <Link href={`/comm-admin/tickets/${t.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-yellow-50/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-500 mb-0.5">{t.ticketNo}</p>
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-xs text-purple-400 mt-0.5">{t.createdBy.name} · {t.createdBy.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge priority={t.priority} />
                    <p className="text-xs text-purple-500">{formatDate(t.createdAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
