import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users, Ticket, Clock, CheckCircle2, AlertTriangle, Mail,
  Shield, Database, Settings, ChevronLeft, Zap, BarChart3,
} from "lucide-react";

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:        { label: "مدير النظام",              color: "#5B21B6", bg: "#EDE9FE" },
  SUPPORT:      { label: "موظف الدعم الفني",         color: "#1D4ED8", bg: "#DBEAFE" },
  USER:         { label: "مستخدم",                   color: "#374151", bg: "#F3F4F6" },
  COMM_SUPPORT: { label: "دعم الاتصال المؤسسي",      color: "#92400E", bg: "#FEF3C7" },
  COMM_ADMIN:   { label: "مدير الاتصال المؤسسي",     color: "#9D174D", bg: "#FCE7F3" },
};

const TYPE_META: Record<string, { label: string; icon: string; desc: string; color: string; bg: string }> = {
  SUPPORT:            { label: "دعم فني",         icon: "🛠️", desc: "أجهزة، شبكة، برمجيات، صلاحيات",      color: "#5B21B6", bg: "#EDE9FE" },
  SHIFA_SUPPORT:      { label: "دعم شفاء",        icon: "🏥", desc: "طلبات الدعم الموجهة لنظام شفاء",       color: "#1D4ED8", bg: "#DBEAFE" },
  DEVELOPMENT:        { label: "تطوير",            icon: "💻", desc: "طلبات تطوير أنظمة — يتطلب اعتماد",     color: "#7E22CE", bg: "#F3E8FF" },
  INSTITUTIONAL_COMM: { label: "طلب تصميم",        icon: "🎨", desc: "طلبات التصميم والاتصال المؤسسي",       color: "#065F46", bg: "#D1FAE5" },
};

const PRIORITY_META = [
  { value: "LOW",      label: "منخفضة", sla: "7 أيام",   color: "#16A34A", bg: "#D1FAE5", border: "#86efac", icon: "🟢" },
  { value: "MEDIUM",   label: "متوسطة", sla: "3 أيام",   color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD", icon: "🔵" },
  { value: "HIGH",     label: "عالية",  sla: "24 ساعة",  color: "#D97706", bg: "#FEF3C7", border: "#FCD34D", icon: "🟡" },
  { value: "CRITICAL", label: "حرجة",   sla: "4 ساعات",  color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", icon: "🔴" },
];

export default async function SettingsPage() {
  const [usersByRole, ticketsByType, ticketsByPriority, systemStats, recentUsers] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.ticket.groupBy({ by: ["type"], _count: true }),
    prisma.ticket.groupBy({ by: ["priority"], _count: true }),
    Promise.all([
      prisma.user.count(),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.ticket.count({ where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    ]),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    }),
  ]);

  const [totalUsers, totalTickets, activeTickets, criticalOpen] = systemStats;

  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1F1535" }}>إعدادات النظام</h1>
          <p className="text-sm mt-0.5" style={{ color: "#7C6A9E" }}>نظرة شاملة على إعدادات وحالة سند</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7" }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          النظام يعمل
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المستخدمين", value: totalUsers,    icon: Users,        color: "#7C3AED", bg: "rgba(124,58,237,0.12)", href: "/admin/users" },
          { label: "إجمالي التذاكر",    value: totalTickets,  icon: Ticket,       color: "#2563EB", bg: "rgba(37,99,235,0.1)",  href: "/admin/tickets" },
          { label: "تذاكر نشطة",        value: activeTickets, icon: Clock,        color: "#D97706", bg: "rgba(245,158,11,0.12)", href: "/admin/tickets?status=OPEN" },
          { label: "حرجة مفتوحة",       value: criticalOpen,  icon: AlertTriangle,color: "#DC2626", bg: "rgba(239,68,68,0.12)", href: "/admin/tickets?priority=CRITICAL" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <Link key={k.label} href={k.href}
              className="rounded-xl p-4 border border-purple-100 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: "#FFFFFF" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: k.bg }}>
                  <Icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-purple-300" />
              </div>
              <p className="text-2xl font-bold" style={{ color: "#1F1535" }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>{k.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Users by role */}
          <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.12)" }}>
                  <Users className="w-4 h-4" style={{ color: "#7C3AED" }} />
                </div>
                <h2 className="font-bold" style={{ color: "#1F1535" }}>المستخدمون حسب الدور</h2>
              </div>
              <Link href="/admin/users"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-purple-50"
                style={{ color: "#7C3AED", border: "1px solid #E9E3FF" }}>
                إدارة المستخدمين
              </Link>
            </div>
            <div className="space-y-3">
              {Object.entries(ROLE_META).map(([role, meta]) => {
                const count = usersByRole.find(r => r.role === role)?._count || 0;
                const pct   = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                return (
                  <div key={role} className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg w-36 text-center flex-shrink-0"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F3EEFF" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                    <span className="text-sm font-bold w-6 text-left" style={{ color: "#1F1535" }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Recent users */}
            <div className="mt-5 pt-4 border-t border-purple-100">
              <p className="text-xs font-semibold mb-3" style={{ color: "#7C6A9E" }}>آخر المستخدمين المضافين</p>
              <div className="space-y-2">
                {recentUsers.map(u => {
                  const rm = ROLE_META[u.role] || ROLE_META["USER"];
                  return (
                    <div key={u.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1F1535" }}>{u.name}</p>
                        <p className="text-xs truncate" style={{ color: "#7C6A9E" }}>{u.email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: rm.bg, color: rm.color }}>
                        {rm.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ticket types */}
          <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.12)" }}>
                <Ticket className="w-4 h-4" style={{ color: "#7C3AED" }} />
              </div>
              <h2 className="font-bold" style={{ color: "#1F1535" }}>أنواع التذاكر</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(TYPE_META).map(([type, meta]) => {
                const count = ticketsByType.find(t => t.type === type)?._count || 0;
                return (
                  <Link key={type} href={`/admin/tickets?type=${type}`}
                    className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-0.5"
                    style={{ background: meta.bg + "66", borderColor: meta.bg }}>
                    <span className="text-2xl flex-shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#7C6A9E" }}>{meta.desc}</p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-xl font-bold" style={{ color: meta.color }}>{count}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>تذكرة</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Priority levels */}
          <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }}>
                <Zap className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="font-bold" style={{ color: "#1F1535" }}>مستويات الأولوية وأهداف SLA</h2>
            </div>
            <div className="space-y-3">
              {PRIORITY_META.map(p => {
                const count = ticketsByPriority.find(t => t.priority === p.value)?._count || 0;
                return (
                  <Link key={p.value} href={`/admin/tickets?priority=${p.value}`}
                    className="flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-sm"
                    style={{ background: p.bg + "80", borderColor: p.border }}>
                    <span className="text-lg flex-shrink-0">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: p.color }}>{p.label}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: p.color + "18", color: p.color }}>
                          هدف الاستجابة: {p.sla}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold" style={{ color: p.color }}>{count}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>تذكرة</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">

          {/* System info */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "white" }}>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 opacity-80" />
              <h2 className="font-bold text-sm">معلومات النظام</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "اسم النظام",    value: "سند" },
                { label: "المنظمة",       value: "كل تحدي وله سند" },
                { label: "الإصدار",       value: "v1.0.0" },
                { label: "المنصة",        value: "Next.js 14 / Prisma" },
                { label: "قاعدة البيانات",value: "SQLite" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs opacity-70">{item.label}</span>
                  <span className="text-xs font-semibold bg-white/15 px-2 py-0.5 rounded">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email/SMTP */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg" style={{ background: smtpConfigured ? "#D1FAE5" : "#FEF2F2" }}>
                <Mail className="w-4 h-4" style={{ color: smtpConfigured ? "#16A34A" : "#DC2626" }} />
              </div>
              <h2 className="font-bold" style={{ color: "#1F1535" }}>إعدادات البريد (SMTP)</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { key: "SMTP_HOST", label: "الخادم",   val: process.env.SMTP_HOST || "smtp.gmail.com" },
                { key: "SMTP_PORT", label: "المنفذ",   val: process.env.SMTP_PORT || "587" },
                { key: "SMTP_USER", label: "المستخدم", val: process.env.SMTP_USER || null },
                { key: "SMTP_PASS", label: "كلمة المرور", val: process.env.SMTP_PASS ? "••••••••" : null },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-1.5 border-b border-purple-50 last:border-0">
                  <span className="text-xs font-medium" style={{ color: "#7C6A9E" }}>{item.label}</span>
                  {item.val ? (
                    <span className="text-xs font-mono font-semibold" style={{ color: "#1F1535" }}>
                      {item.val}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "#FEF2F2", color: "#DC2626" }}>
                      غير محدد
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl"
              style={{
                background: smtpConfigured ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${smtpConfigured ? "#86efac" : "#FCA5A5"}`
              }}>
              <div className={`w-2 h-2 rounded-full ${smtpConfigured ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-xs font-semibold" style={{ color: smtpConfigured ? "#16A34A" : "#DC2626" }}>
                {smtpConfigured ? "البريد جاهز للإرسال" : "البريد غير مفعّل — الإشعارات معطلة"}
              </span>
            </div>
          </div>

          {/* Database */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg" style={{ background: "#D1FAE5" }}>
                <Database className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-bold" style={{ color: "#1F1535" }}>قاعدة البيانات</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "الحالة",     value: "متصلة",   ok: true  },
                { label: "نوع قاعدة البيانات", value: "SQLite",  ok: true  },
                { label: "المستخدمون", value: `${totalUsers} سجل`,     ok: true  },
                { label: "التذاكر",    value: `${totalTickets} سجل`,    ok: true  },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-purple-50 last:border-0">
                  <span className="text-xs font-medium" style={{ color: "#7C6A9E" }}>{row.label}</span>
                  <span className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: row.ok ? "#16A34A" : "#DC2626" }}>
                    {row.ok && <CheckCircle2 className="w-3 h-3" />}
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.12)" }}>
                <BarChart3 className="w-4 h-4" style={{ color: "#7C3AED" }} />
              </div>
              <h2 className="font-bold" style={{ color: "#1F1535" }}>روابط سريعة</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: "إدارة المستخدمين",        href: "/admin/users",                      icon: Users },
                { label: "جميع التذاكر",             href: "/admin/tickets",                    icon: Ticket },
                { label: "التقارير والإحصاءات",      href: "/admin/reports",                    icon: BarChart3 },
                { label: "التذاكر بانتظار الاعتماد", href: "/admin/tickets?status=PENDING_APPROVAL", icon: Shield },
              ].map(l => {
                const Icon = l.icon;
                return (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-purple-50 group">
                    <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.08)" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                    </div>
                    <span className="text-sm flex-1" style={{ color: "#1F1535" }}>{l.label}</span>
                    <ChevronLeft className="w-3.5 h-3.5 text-purple-300 group-hover:text-purple-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
