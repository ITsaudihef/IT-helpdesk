"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const HEF_COLORS = ["#7C3AED", "#5B21B6", "#9dd274", "#c3e4a6", "#58a033", "#438026"];

const ARABIC_TYPE: Record<string, string> = {
  SUPPORT: "دعم فني", SHIFA_SUPPORT: "دعم فني - شفاء", DEVELOPMENT: "تطوير",
  HARDWARE: "أجهزة", SOFTWARE: "برمجيات", NETWORK: "شبكة", ACCESS: "صلاحيات", OTHER: "أخرى",
};
const ARABIC_STATUS: Record<string, string> = {
  OPEN: "مفتوحة", IN_PROGRESS: "قيد المعالجة", WAITING_INFO: "بانتظار معلومات",
  PENDING_APPROVAL: "بانتظار الاعتماد", RESOLVED: "تم الحل", CLOSED: "مغلقة",
};
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  OPEN:             { bg: "rgba(124,58,237,0.12)", fg: "#5B21B6" },
  IN_PROGRESS:      { bg: "#fef3c7", fg: "#d97706" },
  WAITING_INFO:     { bg: "#ede9fe", fg: "#7c3aed" },
  PENDING_APPROVAL: { bg: "#fde68a", fg: "#92400e" },
  RESOLVED:         { bg: "#dcfce7", fg: "#16a34a" },
  CLOSED:           { bg: "#f3f4f6", fg: "#6b7280" },
};
const TYPE_META: Record<string, { bg: string; fg: string; icon: string }> = {
  SUPPORT:       { bg: "rgba(124,58,237,0.12)", fg: "#5B21B6", icon: "🛠️" },
  SHIFA_SUPPORT: { bg: "#dbeafe", fg: "#1d4ed8", icon: "🏥" },
  DEVELOPMENT:   { bg: "#f3e8ff", fg: "#7c3aed", icon: "💻" },
};
const ARABIC_PRIORITY: Record<string, string> = { CRITICAL: "حرجة", HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" };
const PRIORITY_COLORS: Record<string, string>  = { حرجة: "#ef4444", عالية: "#f97316", متوسطة: "#7C3AED", منخفضة: "#5B21B6" };

export default function ReportsClient() {
  const [period,  setPeriod]  = useState("monthly");
  const [data,    setData]    = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/reports/weekly?period=${period}`).then(r => r.json()),
      fetch("/api/reports/summary").then(r => r.json()),
    ]).then(([w, s]) => { setData(w); setSummary(s); }).finally(() => setLoading(false));
  }, [period]);

  if (loading || !data || !summary) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-white/5 p-6 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const typeData     = data.typeData.map((d: any) => ({ ...d, name: ARABIC_TYPE[d.name]     || d.name }));
  const priorityData = data.priorityData.map((d: any) => ({ ...d, name: ARABIC_PRIORITY[d.name] || d.name }));

  const sb = summary.statusBreakdown || {};
  const tb = summary.typeBreakdown   || {};
  const typeTotal = Math.max((tb.SUPPORT || 0) + (tb.SHIFA_SUPPORT || 0) + (tb.DEVELOPMENT || 0), 1);

  const STATUS_KEYS = ["OPEN", "IN_PROGRESS", "WAITING_INFO", "PENDING_APPROVAL", "RESOLVED", "CLOSED"] as const;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2 bg-white rounded-xl border border-white/5 p-4 shadow-sm">
        {[{ value: "weekly", label: "أسبوعي" }, { value: "monthly", label: "شهري" }, { value: "quarterly", label: "ربعي" }].map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={period === p.value
              ? { background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff" }
              : { color: "#6b7280", background: "transparent" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي التذاكر",  value: summary.total,                    fg: "#5B21B6", bg: "rgba(124,58,237,0.12)" },
          { label: "تذاكر حرجة",      value: summary.critical,                 fg: "#dc2626", bg: "#fee2e2" },
          { label: "محلولة + مغلقة",  value: summary.resolved,                 fg: "#16a34a", bg: "#dcfce7" },
          { label: "متوسط وقت الحل",  value: `${summary.avgResolutionHours}س`, fg: "#d97706", bg: "#fef3c7" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-white/5 p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: k.fg }}>{k.value}</p>
            <p className="text-xs text-purple-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Detailed Status Breakdown ── */}
      <div className="bg-white rounded-xl border border-white/5 p-5 shadow-sm">
        <h3 className="font-bold text-white mb-4">إحصائيات التذاكر حسب الحالة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATUS_KEYS.map((key) => {
            const c   = STATUS_COLORS[key];
            const val = sb[key] || 0;
            const pct = summary.total > 0 ? Math.round((val / summary.total) * 100) : 0;
            return (
              <div key={key} className="rounded-xl border p-4 text-center flex flex-col items-center gap-1"
                style={{ background: c.bg, borderColor: c.fg + "40" }}>
                <p className="text-2xl font-bold" style={{ color: c.fg }}>{val}</p>
                <p className="text-xs font-semibold leading-tight" style={{ color: c.fg }}>{ARABIC_STATUS[key]}</p>
                <div className="w-full h-1.5 rounded-full mt-1" style={{ background: c.fg + "30" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: c.fg }} />
                </div>
                <p className="text-xs" style={{ color: c.fg + "99" }}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detailed Type Breakdown ── */}
      <div className="bg-white rounded-xl border border-white/5 p-5 shadow-sm">
        <h3 className="font-bold text-white mb-4">إحصائيات التذاكر حسب النوع</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["SUPPORT", "SHIFA_SUPPORT", "DEVELOPMENT"] as const).map((key) => {
            const meta = TYPE_META[key];
            const val  = tb[key] || 0;
            const pct  = Math.round((val / typeTotal) * 100);
            return (
              <div key={key} className="rounded-xl border p-5 flex flex-col gap-3"
                style={{ background: meta.bg, borderColor: meta.fg + "40" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <p className="text-sm font-bold" style={{ color: meta.fg }}>{ARABIC_TYPE[key]}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: meta.fg }}>{val}</p>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: meta.fg + "25" }}>
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: meta.fg }} />
                </div>
                <p className="text-xs" style={{ color: meta.fg + "99" }}>{pct}% من الإجمالي</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incoming vs Resolved */}
        <div className="bg-white rounded-xl border border-white/5 p-5 shadow-sm">
          <h3 className="font-bold text-white mb-4">الواردة مقابل المحلولة</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="created"  name="واردة"  fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="محلولة" fill="#5B21B6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Type pie */}
        <div className="bg-white rounded-xl border border-white/5 p-5 shadow-sm">
          <h3 className="font-bold text-white mb-4">توزيع أنواع التذاكر</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" nameKey="name" label={false}>
                {typeData.map((_: any, i: number) => <Cell key={i} fill={HEF_COLORS[i % HEF_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Staff performance */}
        <div className="bg-white rounded-xl border border-white/5 p-5 shadow-sm">
          <h3 className="font-bold text-white mb-4">أداء موظفي الدعم</h3>
          {data.staffData.length === 0 ? (
            <p className="text-sm text-purple-500 text-center py-8">لا توجد بيانات بعد</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.staffData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="resolved"  name="محلولة"             fill="#7C3AED" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgHours"  name="متوسط الحل (ساعة)" fill="#5B21B6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority distribution */}
        <div className="bg-white rounded-xl border border-white/5 p-5 shadow-sm">
          <h3 className="font-bold text-white mb-4">توزيع الأولويات</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" name="عدد التذاكر" radius={[4, 4, 0, 0]}>
                {priorityData.map((d: any, i: number) => (
                  <Cell key={i} fill={PRIORITY_COLORS[d.name] || HEF_COLORS[i % HEF_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
