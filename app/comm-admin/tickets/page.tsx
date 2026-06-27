import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";

export default async function CommAdminAllTicketsPage() {
  const tickets = await prisma.ticket.findMany({
    where: { type: "INSTITUTIONAL_COMM" },
    include: {
      createdBy: { select: { name: true, department: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="font-bold text-white">جميع تذاكر التواصل المؤسسي</h2>
      </div>
      {tickets.length === 0 ? (
        <p className="text-center text-purple-500 py-12 text-sm">لا توجد تذاكر</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {tickets.map(t => (
            <li key={t.id}>
              <Link href={`/comm-admin/tickets/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-purple-900/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-500 mb-0.5">{t.ticketNo}</p>
                  <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                  <p className="text-xs text-purple-400 mt-0.5">
                    {t.createdBy.name}
                    {t.assignedTo ? ` · مكلّف: ${t.assignedTo.name}` : ""}
                  </p>
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
  );
}
