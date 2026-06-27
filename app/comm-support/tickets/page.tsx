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
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-bold text-white">تذاكري المرفوعة</h2>
        <Link href="/comm-support/new"
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: "#7C3AED" }}>+ تذكرة جديدة</Link>
      </div>
      {tickets.length === 0 ? (
        <p className="text-center text-purple-500 py-12 text-sm">لم ترفع أي تذكرة بعد</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {tickets.map(t => (
            <li key={t.id}>
              <Link href={`/portal/tickets/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-purple-900/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-500 mb-0.5">{t.ticketNo} · {typeLabel[t.type] ?? t.type}</p>
                  <p className="text-sm font-semibold text-white truncate">{t.title}</p>
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
