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
          { label: "مفتوحة",           value: open,        bg: "rgba(148,163,184,0.12)", fg: "#64748B" },
          { label: "قيد المعالجة",     value: inProgress,  bg: "rgba(245,158,11,0.15)",  fg: "#D97706" },
          { label: "بانتظار معلومات",  value: waiting,     bg: "rgba(124,58,237,0.15)",  fg: "#7C3AED" },
          { label: "مغلقة (منجزة)",    value: closedCount, bg: "rgba(100,116,139,0.12)", fg: "#475569" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-purple-100 p-4 text-center" style={{ background: "#FFFFFF" }}>
            <p className="text-2xl font-bold" style={{ color: s.fg }}>{s.value}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
              style={{ background: s.bg, color: s.fg }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold mb-4" style={{ color: "#1F1535" }}>
          التذاكر المسندة إليّ ({sorted.length}) — مرتبة بالأولوية
        </h2>

        {sorted.length === 0 ? (
          <div className="rounded-2xl p-12 text-center shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.12)" }}>
              <HeadphonesIcon className="w-8 h-8" style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-semibold" style={{ color: "#1F1535" }}>لا توجد تذاكر مسندة</h3>
            <p className="text-sm text-purple-600 mt-1">أنت متاح لاستقبال تذاكر جديدة</p>
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
