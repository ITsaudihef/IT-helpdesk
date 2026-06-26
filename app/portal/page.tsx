import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, Ticket, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import TicketCard from "@/components/tickets/TicketCard";

export default async function PortalPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [tickets, stats] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdById: userId },
      include: { assignedTo: { select: { name: true } }, _count: { select: { comments: true, attachments: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.ticket.groupBy({ by: ["status"], where: { createdById: userId }, _count: true }),
  ]);

  const total      = stats.reduce((a, s) => a + s._count, 0);
  const open       = stats.find((s) => s.status === "OPEN")?._count || 0;
  const inProgress = stats.find((s) => s.status === "IN_PROGRESS")?._count || 0;
  const resolved   = stats.filter((s) => ["RESOLVED","CLOSED"].includes(s.status)).reduce((a, s) => a + s._count, 0);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)" }}>
        <div className="absolute top-[-40px] left-[-40px] w-48 h-48 rounded-full opacity-10 bg-white" />
        <div className="relative">
          <h1 className="text-xl font-bold mb-1">مرحباً، {session!.user.name} 👋</h1>
          <p className="text-purple-900 text-sm">يمكنك رفع طلبات دعم IT وتتبع حالتها من هنا</p>
          <Link href="/portal/new"
            className="inline-flex items-center gap-2 mt-4 bg-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-purple-950"
            style={{ color: "#5B21B6" }}>
            <PlusCircle className="w-4 h-4" />
            رفع تذكرة جديدة
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي التذاكر", value: total,      icon: Ticket,       bg: "#f4f4f5",  fg: "#1a1a1a" },
          { label: "مفتوحة",         value: open,       icon: AlertCircle,  bg: "rgba(124,58,237,0.12)",  fg: "#5B21B6" },
          { label: "قيد المعالجة",   value: inProgress, icon: Clock,        bg: "#fef3c7",  fg: "#d97706" },
          { label: "محلولة",         value: resolved,   icon: CheckCircle2, bg: "#dcfce7",  fg: "#16a34a" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-white/5 p-4 shadow-sm">
              <div className="inline-flex p-2 rounded-lg mb-2" style={{ background: stat.bg }}>
                <Icon className="w-4 h-4" style={{ color: stat.fg }} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-purple-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">آخر التذاكر</h2>
          <Link href="/portal/tickets" className="text-sm font-medium hover:underline" style={{ color: "#7C3AED" }}>
            عرض الكل
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }} className_unused=" p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.12)" }}>
              <Ticket className="w-8 h-8" style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-semibold text-white mb-1">لا توجد تذاكر بعد</h3>
            <p className="text-sm text-purple-400 mb-4">ارفع أول تذكرة دعم لك</p>
            <Link href="/portal/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#7C3AED" }}>
              <PlusCircle className="w-4 h-4" />
              تذكرة جديدة
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/portal/tickets/${ticket.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
