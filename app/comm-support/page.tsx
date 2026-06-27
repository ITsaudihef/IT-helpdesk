import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { statusLabel, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/tickets/StatusBadge";

export default async function CommSupportPage() {
  const session = await auth();

  const tickets = await prisma.ticket.findMany({
    where: {
      type: "INSTITUTIONAL_COMM",
      assignedToId: session!.user.id,
    },
    include: { createdBy: { select: { name: true, department: true } } },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    open:       tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved:   tickets.filter(t => t.status === "RESOLVED").length,
    total:      tickets.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "قيد المعالجة", value: counts.open,     color: "#3b82f6" },
          { label: "محلولة",       value: counts.resolved,  color: "#22c55e" },
          { label: "الإجمالي",     value: counts.total,     color: "#7C3AED" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 shadow-sm text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-purple-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tickets */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-bold text-white">تذاكر التواصل المؤسسي المكلّف بها</h2>
        </div>
        {tickets.length === 0 ? (
          <p className="text-center text-purple-500 py-12 text-sm">لا توجد تذاكر مكلّفة</p>
        ) : (
          <ul className="divide-y divide-purple-100">
            {tickets.map(t => (
              <li key={t.id}>
                <Link href={`/comm-support/tickets/${t.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-purple-900/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-500 mb-0.5">{t.ticketNo}</p>
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-xs text-purple-400 mt-0.5">{t.createdBy.name} · {t.createdBy.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={t.status} />
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
