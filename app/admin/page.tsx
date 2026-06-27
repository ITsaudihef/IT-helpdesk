import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Ticket, Users, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import TicketCard from "@/components/tickets/TicketCard";

export default async function AdminDashboard() {
  const [total, open, inProgress, resolved, pending, critical, recentTickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.ticket.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.ticket.count({ where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, department: true } },
        assignedTo: { select: { name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    }),
  ]);

  const kpis = [
    { label: "إجمالي التذاكر",      value: total,      icon: Ticket,        bg: "rgba(124,58,237,0.15)", fg: "#7C3AED", trend: "" },
    { label: "مفتوحة",              value: open,       icon: AlertTriangle, bg: "rgba(148,163,184,0.12)", fg: "#64748B", trend: "" },
    { label: "قيد المعالجة",        value: inProgress, icon: Clock,         bg: "rgba(245,158,11,0.15)", fg: "#D97706", trend: "" },
    { label: "محلولة/مغلقة",        value: resolved,   icon: CheckCircle2,  bg: "rgba(34,197,94,0.15)",  fg: "#16A34A", trend: "" },
    { label: "بانتظار الاعتماد",    value: pending,    icon: TrendingUp,    bg: "rgba(124,58,237,0.15)", fg: "#7C3AED", trend: pending > 0 ? "يحتاج انتباه!" : "" },
    { label: "تذاكر حرجة",          value: critical,   icon: AlertTriangle, bg: "rgba(239,68,68,0.15)",  fg: "#DC2626", trend: critical > 0 ? "عاجل!" : "" },
  ];

  return (
    <div className="space-y-6">
      {/* Pending approvals alert */}
      {pending > 0 && (
        <div className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" style={{ color: "#FCD34D" }} />
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
              {pending} تذكرة تنتظر اعتمادك
            </p>
          </div>
          <Link href="/admin/tickets?status=PENDING_APPROVAL"
            className="text-sm font-semibold hover:underline" style={{ color: "#C4B5FD" }}>
            مراجعة الآن ←
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-purple-100 p-4" style={{ background: "#FFFFFF" }}>
              <div className="inline-flex p-2 rounded-lg mb-2" style={{ background: kpi.bg }}>
                <Icon className="w-4 h-4" style={{ color: kpi.fg }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "#1F1535" }}>{kpi.value}</p>
              <p className="text-xs text-purple-400 mt-0.5">{kpi.label}</p>
              {kpi.trend && <p className="text-xs font-bold mt-1" style={{ color: "#DC2626" }}>{kpi.trend}</p>}
            </div>
          );
        })}
      </div>

      {/* Recent tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: "#1F1535" }}>أحدث التذاكر</h2>
          <Link href="/admin/tickets" className="text-sm font-medium hover:underline" style={{ color: "#7C3AED" }}>
            عرض الكل
          </Link>
        </div>
        <div className="space-y-3">
          {recentTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} href={`/admin/tickets/${ticket.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
