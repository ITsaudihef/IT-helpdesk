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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">جميع تذاكر التواصل المؤسسي</h2>
      </div>
      {tickets.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">لا توجد تذاكر</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {tickets.map(t => (
            <li key={t.id}>
              <Link href={`/comm-admin/tickets/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-green-50/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{t.ticketNo}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.createdBy.name}
                    {t.assignedTo ? ` · مكلّف: ${t.assignedTo.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={t.status} />
                  <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
