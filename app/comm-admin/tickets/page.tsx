import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import Pagination from "@/components/ui/Pagination";

const PER_PAGE = 20;

export default async function CommAdminAllTicketsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page  = Math.max(1, parseInt(searchParams.page || "1"));
  const where = { type: "INSTITUTIONAL_COMM" as const };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        createdBy:  { select: { name: true, department: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <div className="px-5 py-4 border-b border-purple-100">
        <h2 className="font-bold" style={{ color: "#1F1535" }}>جميع تذاكر الاتصال المؤسسي ({total})</h2>
      </div>
      {total === 0 ? (
        <p className="text-center text-purple-500 py-12 text-sm">لا توجد تذاكر</p>
      ) : (
        <ul className="divide-y divide-purple-100">
          {tickets.map(t => (
            <li key={t.id}>
              <Link href={`/comm-admin/tickets/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-purple-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-500 mb-0.5">{t.ticketNo}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: "#1F1535" }}>{t.title}</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    {t.createdBy.name}
                    {t.assignedTo ? ` · مكلّف: ${t.assignedTo.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={t.status} />
                  <p className="text-xs text-purple-500">{formatDate(t.updatedAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="px-5 pb-4">
        <Pagination total={total} page={page} perPage={PER_PAGE} />
      </div>
    </div>
  );
}
