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
    { label: "إجمالي التذاكر",      value: total,      icon: Ticket,       bg: "#e0f1d0", fg: "#00805b", trend: "" },
    { label: "مفتوحة",              value: open,       icon: AlertTriangle, bg: "#fef9c3", fg: "#a16207", trend: "" },
    { label: "قيد المعالجة",        value: inProgress, icon: Clock,        bg: "#fef3c7", fg: "#d97706", trend: "" },
    { label: "محلولة/مغلقة",        value: resolved,   icon: CheckCircle2, bg: "#dcfce7", fg: "#16a34a", trend: "" },
    { label: "بانتظار الاعتماد",    value: pending,    icon: TrendingUp,   bg: "#ede9fe", fg: "#7c3aed", trend: pending > 0 ? "يحتاج انتباه!" : "" },
    { label: "تذاكر حرجة",          value: critical,   icon: AlertTriangle, bg: "#fee2e2", fg: "#dc2626", trend: critical > 0 ? "عاجل!" : "" },
  ];

  return (
    <div className="space-y-6">
      {/* Pending approvals alert */}
      {pending > 0 && (
        <div className="rounded-xl p-4 flex items-center justify-between border"
          style={{ background: "#fefce8", borderColor: "#fde047" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" style={{ color: "#a16207" }} />
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
              {pending} تذكرة تنتظر اعتمادك
            </p>
          </div>
          <Link href="/admin/tickets?status=PENDING_APPROVAL"
            className="text-sm font-semibold hover:underline" style={{ color: "#00805b" }}>
            مراجعة الآن ←
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="inline-flex p-2 rounded-lg mb-2" style={{ background: kpi.bg }}>
                <Icon className="w-4 h-4" style={{ color: kpi.fg }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              {kpi.trend && <p className="text-xs font-bold mt-1" style={{ color: "#dc2626" }}>{kpi.trend}</p>}
            </div>
          );
        })}
      </div>

      {/* Recent tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">أحدث التذاكر</h2>
          <Link href="/admin/tickets" className="text-sm font-medium hover:underline" style={{ color: "#6fb54a" }}>
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
