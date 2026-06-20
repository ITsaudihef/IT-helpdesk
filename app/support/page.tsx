import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketCard from "@/components/tickets/TicketCard";
import { HeadphonesIcon } from "lucide-react";

const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default async function SupportDashboard() {
  const session = await auth();
  const userId  = session!.user.id;

  const [tickets, closedCount] = await Promise.all([
    prisma.ticket.findMany({
      where: { assignedToId: userId, status: { notIn: ["CLOSED"] } },
      include: {
        createdBy:  { select: { name: true, department: true } },
        assignedTo: { select: { name: true } },
        _count:     { select: { comments: true, attachments: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.ticket.count({ where: { assignedToId: userId, status: "CLOSED" } }),
  ]);

  const sorted = [...tickets].sort(
    (a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3)
            - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3)
  );

  const open       = tickets.filter(t => t.status === "OPEN").length;
  const inProgress = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const waiting    = tickets.filter(t => t.status === "WAITING_INFO").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "مفتوحة",           value: open,        bg: "#e0f1d0", fg: "#00805b" },
          { label: "قيد المعالجة",     value: inProgress,  bg: "#fef3c7", fg: "#d97706" },
          { label: "بانتظار معلومات",  value: waiting,     bg: "#ede9fe", fg: "#7c3aed" },
          { label: "مغلقة (منجزة)",    value: closedCount, bg: "#f3f4f6", fg: "#6b7280" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: s.fg }}>{s.value}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ background: s.bg, color: s.fg }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold text-gray-900 mb-4">
          التذاكر المسندة إليّ ({sorted.length}) — مرتبة بالأولوية
        </h2>

        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e0f1d0" }}>
              <HeadphonesIcon className="w-8 h-8" style={{ color: "#6fb54a" }} />
            </div>
            <h3 className="font-semibold text-gray-900">لا توجد تذاكر مسندة</h3>
            <p className="text-sm text-gray-500 mt-1">أنت متاح لاستقبال تذاكر جديدة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/support/tickets/${ticket.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
