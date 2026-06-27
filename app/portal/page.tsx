import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, Ticket, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import TicketCard from "@/components/tickets/TicketCard";

export default async function PortalPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [tickets, stats] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdById: userId },
      include: { assignedTo: { select: { name: true } }, _count: { select: { comments: true, attachments: true } } },
      orderBy: { updatedAt: "desc" },
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

      {/* ── Hero CTA + welcome ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Create ticket — main CTA (takes 2/3 width on desktop) */}
        <Link href="/portal/new"
          className="lg:col-span-2 group rounded-2xl p-5 sm:p-7 flex items-center justify-between relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)" }}>
          {/* Decorative circles */}
          <div className="absolute top-[-50px] left-[-50px] w-56 h-56 rounded-full opacity-10 bg-white pointer-events-none" />
          <div className="absolute bottom-[-30px] right-[40%] w-32 h-32 rounded-full opacity-10 bg-white pointer-events-none" />

          <div className="relative">
            <p className="text-purple-200 text-sm mb-1">مرحباً، {session!.user.name} 👋</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">ارفع تذكرة دعم جديدة</h1>
            <div className="inline-flex items-center gap-2 bg-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all group-hover:bg-purple-50"
              style={{ color: "#5B21B6" }}>
              <PlusCircle className="w-4 h-4" />
              إنشاء تذكرة
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>

          {/* Big icon */}
          <div className="relative hidden sm:flex w-24 h-24 rounded-2xl items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <PlusCircle className="w-12 h-12 text-white opacity-80" />
          </div>
        </Link>

        {/* Quick stats summary */}
        <div className="rounded-2xl p-5 flex flex-col justify-between"
          style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <p className="text-xs font-semibold text-purple-500 mb-3">ملخص تذاكري</p>
          <div className="space-y-3">
            {[
              { label: "مفتوحة",       value: open,       color: "#64748B", bg: "rgba(148,163,184,0.12)" },
              { label: "قيد المعالجة", value: inProgress, color: "#D97706", bg: "rgba(245,158,11,0.15)"  },
              { label: "محلولة",       value: resolved,   color: "#16A34A", bg: "rgba(34,197,94,0.15)"   },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6B6B8A" }}>{s.label}</span>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
                  style={{ background: s.bg, color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between">
            <span className="text-xs text-purple-400">الإجمالي</span>
            <span className="text-lg font-bold" style={{ color: "#1F1535" }}>{total}</span>
          </div>
        </div>
      </div>

      {/* ── Recent tickets ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: "#1F1535" }}>آخر التذاكر</h2>
          <Link href="/portal/tickets" className="text-sm font-medium hover:underline" style={{ color: "#7C3AED" }}>
            عرض الكل
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl p-12 text-center shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.12)" }}>
              <Ticket className="w-8 h-8" style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: "#1F1535" }}>لا توجد تذاكر بعد</h3>
            <p className="text-sm text-purple-400 mb-4">ارفع أول تذكرة دعم لك</p>
            <Link href="/portal/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}>
              <PlusCircle className="w-4 h-4" />
              إنشاء تذكرة الآن
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
