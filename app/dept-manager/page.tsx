import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShieldCheck, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import { formatDate } from "@/lib/utils";

export default async function DeptManagerPage() {
  const session = await auth();
  const dept = (session!.user as any).department as string;

  const [pending, approved, returned, total] = await Promise.all([
    prisma.ticket.findMany({
      where: { type: "DEVELOPMENT", status: "PENDING_DEPT_APPROVAL", createdBy: { department: dept } },
      include: { createdBy: { select: { name: true, department: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ticket.count({
      where: { type: "DEVELOPMENT", status: { in: ["PENDING_APPROVAL", "IN_PROGRESS", "RESOLVED", "CLOSED"] }, createdBy: { department: dept } },
    }),
    prisma.ticket.count({
      where: { type: "DEVELOPMENT", status: "OPEN", createdBy: { department: dept } },
    }),
    prisma.ticket.count({
      where: { type: "DEVELOPMENT", createdBy: { department: dept } },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg" style={{ color: "#1F1535" }}>لوحة مدير القسم</h1>
          <p className="text-sm text-purple-500">القسم: {dept || "غير محدد"}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "بانتظار اعتمادك",  value: pending.length, color: "#EA580C", bg: "rgba(234,88,12,0.1)",    icon: Clock },
          { label: "تم الاعتماد",       value: approved,        color: "#16A34A", bg: "rgba(22,163,74,0.1)",    icon: CheckCircle },
          { label: "مُعادة / مفتوحة",   value: returned,        color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: XCircle },
          { label: "إجمالي طلبات التطوير", value: total,        color: "#7C3AED", bg: "rgba(124,58,237,0.1)", icon: ShieldCheck },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border border-purple-100" style={{ background: "#FFFFFF" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-purple-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pending approval list */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-purple-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="font-bold" style={{ color: "#1F1535" }}>
              طلبات التطوير — بانتظار اعتمادك ({pending.length})
            </h2>
          </div>
          <Link href="/dept-manager/tickets"
            className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: "#7C3AED" }}>
            عرض الكل <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-14">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="font-semibold" style={{ color: "#1F1535" }}>لا توجد طلبات بانتظار الاعتماد</p>
            <p className="text-sm text-purple-500 mt-1">جميع الطلبات تمت معالجتها</p>
          </div>
        ) : (
          <ul className="divide-y divide-purple-100">
            {pending.map(t => (
              <li key={t.id}>
                <Link href={`/dept-manager/tickets/${t.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-purple-500 mb-0.5">{t.ticketNo}</p>
                    <p className="text-sm font-semibold truncate" style={{ color: "#1F1535" }}>{t.title}</p>
                    <p className="text-xs text-purple-400 mt-0.5">{t.createdBy.name} · {t.createdBy.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <PriorityBadge priority={t.priority} />
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
