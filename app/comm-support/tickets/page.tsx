import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, typeLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/tickets/StatusBadge";

export default async function CommSupportMyTicketsPage() {
  const session = await auth();

  const tickets = await prisma.ticket.findMany({
    where: { createdById: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">تذاكري المرفوعة</h2>
        <Link href="/comm-support/new"
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: "#6fb54a" }}>+ تذكرة جديدة</Link>
      </div>
      {tickets.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">لم ترفع أي تذكرة بعد</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {tickets.map(t => (
            <li key={t.id}>
              <Link href={`/portal/tickets/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-green-50/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{t.ticketNo} · {typeLabel[t.type] ?? t.type}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
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
