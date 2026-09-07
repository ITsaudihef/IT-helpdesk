"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ColumnCount { title: string; count: number; }

interface ProjectRow {
  id: string;
  title: string;
  color: string;
  progressPct: number;
  cardTotal: number;
  cardDone: number;
  overdueTasks: number;
  columns: ColumnCount[];
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
  status: "متأخر" | "قادم" | "مكتمل" | "نشط";
  memberCount: number;
  updatedAt: string;
}

interface DeptGroup {
  name: string;
  projectCount: number;
  overdueCount: number;
  totalTasks: number;
  doneTasks: number;
  avgProgress: number;
  projects: ProjectRow[];
}

interface ExecutiveSummary {
  totalProjects: number;
  activeProjects: number;
  overdueProjects: number;
  upcomingProjects: number;
  completedProjects: number;
  avgProgress: number;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  departmentCount: number;
  openPriorityBreakdown: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
  departments: DeptGroup[];
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  "نشط":   { bg: "#E3F2E0", fg: "#00543D" },
  "متأخر": { bg: "#FEE2E2", fg: "#DC2626" },
  "قادم":  { bg: "#F1F5F9", fg: "#475569" },
  "مكتمل": { bg: "#DBEAFE", fg: "#1D4ED8" },
};

const PRIORITY_LABEL: Record<string, string> = { CRITICAL: "حرجة", HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" };
const PRIORITY_COLOR: Record<string, string> = { CRITICAL: "#DC2626", HIGH: "#C2410C", MEDIUM: "#2563EB", LOW: "#16A34A" };

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA-u-nu-latn", { day: "numeric", month: "short", year: "numeric", calendar: "gregory", timeZone: "Asia/Riyadh" });
}

export default function ExecutiveReportsClient() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/reports/executive")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSummary)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-purple-100 p-6 h-32 animate-pulse" style={{ background: "#FFFFFF" }} />
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-red-100 p-6 text-center text-sm" style={{ background: "#FFFFFF", color: "#DC2626" }}>
        تعذر تحميل التقرير — يرجى المحاولة مرة أخرى لاحقاً
      </div>
    );
  }

  const priorityData = Object.entries(summary.openPriorityBreakdown)
    .map(([key, value]) => ({ name: PRIORITY_LABEL[key] || key, value, color: PRIORITY_COLOR[key] }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "إجمالي المشاريع",  value: summary.totalProjects,     fg: "#00543D", bg: "#E3F2E0" },
          { label: "نشطة",             value: summary.activeProjects,    fg: "#1D4ED8", bg: "#DBEAFE" },
          { label: "متأخرة",           value: summary.overdueProjects,   fg: "#DC2626", bg: "#FEE2E2" },
          { label: "لم تبدأ",          value: summary.upcomingProjects,  fg: "#475569", bg: "#F1F5F9" },
          { label: "مكتملة",           value: summary.completedProjects, fg: "#1D4ED8", bg: "#DBEAFE" },
          { label: "متوسط التقدم",     value: `${summary.avgProgress}%`, fg: "#92400E", bg: "#FEF3C7" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-purple-100 p-4" style={{ background: "#FFFFFF" }}>
            <p className="text-2xl font-bold" style={{ color: k.fg }}>{k.value}</p>
            <p className="text-xs text-purple-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Task-level stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-purple-100 p-4 flex items-center justify-between" style={{ background: "#FFFFFF" }}>
          <div>
            <p className="text-xs text-purple-400">إجمالي المهام</p>
            <p className="text-xl font-bold" style={{ color: "#16241D" }}>{summary.totalTasks}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-purple-400">مكتملة</p>
            <p className="text-xl font-bold" style={{ color: "#16A34A" }}>{summary.doneTasks}</p>
          </div>
        </div>
        <div className="rounded-xl border border-purple-100 p-4" style={{ background: "#FFFFFF" }}>
          <p className="text-xs text-purple-400">مهام متأخرة (تجاوزت تاريخ الاستحقاق)</p>
          <p className="text-xl font-bold" style={{ color: summary.overdueTasks > 0 ? "#DC2626" : "#16241D" }}>{summary.overdueTasks}</p>
        </div>
        <div className="rounded-xl border border-purple-100 p-4" style={{ background: "#FFFFFF" }}>
          <p className="text-xs text-purple-400">عدد الإدارات التي لديها مشاريع</p>
          <p className="text-xl font-bold" style={{ color: "#16241D" }}>{summary.departmentCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly project creation trend */}
        {summary.monthlyTrend.length > 0 && (
          <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
            <h3 className="font-bold mb-4" style={{ color: "#16241D" }}>مشاريع جديدة — آخر 6 أشهر</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="مشاريع جديدة" fill="#007F5C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Open task priority breakdown */}
        {priorityData.length > 0 && (
          <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
            <h3 className="font-bold mb-4" style={{ color: "#16241D" }}>أولوية المهام غير المكتملة</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name">
                  {priorityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Department Summary ── */}
      <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
        <h3 className="font-bold mb-4" style={{ color: "#16241D" }}>ملخص الإدارات</h3>
        {summary.departments.length === 0 ? (
          <p className="text-sm text-purple-500 text-center py-8">لا توجد مشاريع بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #DCEAD9" }}>
                  {["الإدارة", "المشاريع", "متأخرة", "المهام", "المكتملة", "متوسط التقدم"].map((h) => (
                    <th key={h} className="text-right py-2 px-3 text-xs font-semibold" style={{ color: "#007F5C" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.departments.map((d) => (
                  <tr key={d.name} style={{ borderBottom: "1px solid #F3EEFF" }} className="transition-colors hover:bg-purple-50">
                    <td className="py-3 px-3 font-medium" style={{ color: "#16241D" }}>{d.name}</td>
                    <td className="py-3 px-3 text-center font-semibold" style={{ color: "#16241D" }}>{d.projectCount}</td>
                    <td className="py-3 px-3 text-center">
                      {d.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>{d.overdueCount}</span>
                      ) : <span style={{ color: "#94A3B8" }}>—</span>}
                    </td>
                    <td className="py-3 px-3 text-center" style={{ color: "#475569" }}>{d.totalTasks}</td>
                    <td className="py-3 px-3 text-center" style={{ color: "#16A34A" }}>{d.doneTasks}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full" style={{ background: "#DCEAD9" }}>
                          <div className="h-2 rounded-full" style={{ width: `${d.avgProgress}%`, background: "#007F5C" }} />
                        </div>
                        <span className="text-xs font-semibold w-9 text-left" style={{ color: "#475569" }}>{d.avgProgress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Projects by Department (detail) ── */}
      <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
        <h3 className="font-bold mb-1" style={{ color: "#16241D" }}>تفاصيل المشاريع حسب الإدارة</h3>
        <p className="text-xs text-purple-400 mb-4">مرتّبة بحيث تظهر المشاريع المتأخرة أولاً في كل إدارة</p>
        {summary.departments.length === 0 ? (
          <p className="text-sm text-purple-500 text-center py-8">لا توجد مشاريع بعد</p>
        ) : (
          <div className="space-y-5">
            {summary.departments.map((dept) => (
              <div key={dept.name} className="rounded-xl border p-4" style={{ borderColor: "#DCEAD9", background: "#FBFCFA" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: "#16241D" }}>{dept.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#E3F2E0", color: "#00543D" }}>
                      {dept.projectCount} مشروع
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#55705F" }}>متوسط التقدم</span>
                    <span className="text-sm font-bold" style={{ color: "#007F5C" }}>{dept.avgProgress}%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {dept.projects.map((p) => {
                    const st = STATUS_STYLE[p.status];
                    return (
                      <div key={p.id} className="rounded-lg p-3" style={{ background: "#FFFFFF", border: "1px solid #F3EEFF" }}>
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <span className="text-sm font-medium truncate" style={{ color: "#16241D" }}>{p.title}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: st.bg, color: st.fg }}>
                            {p.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full" style={{ background: "#DCEAD9" }}>
                            <div className="h-2 rounded-full transition-all"
                              style={{ width: `${p.progressPct}%`, background: p.progressPct >= 100 ? "#22c55e" : "#007F5C" }} />
                          </div>
                          <span className="text-xs font-semibold w-10 text-left" style={{ color: "#475569" }}>{p.progressPct}%</span>
                        </div>

                        {/* Stage breakdown */}
                        {p.columns.length > 0 && p.cardTotal > 0 && (
                          <div className="flex gap-1 mt-2">
                            {p.columns.map((c, i) => (
                              <div key={i} className="flex-1 text-center">
                                <div className="h-1.5 rounded-full" style={{ background: i === p.columns.length - 1 ? "#22c55e" : "#DCEAD9" }} />
                                <p className="text-[10px] mt-0.5 truncate" style={{ color: "#94A3B8" }}>{c.title} ({c.count})</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "#94A3B8" }}>
                          <span>{p.cardDone}/{p.cardTotal} مهمة مكتملة</span>
                          <span>{p.memberCount} أعضاء</span>
                          {p.endDate && (
                            <span style={{ color: p.status === "متأخر" ? "#DC2626" : "#94A3B8" }}>
                              {p.status === "متأخر"
                                ? `تجاوز الموعد المحدد (${formatDate(p.endDate)})`
                                : p.daysRemaining !== null
                                ? `باقي ${p.daysRemaining} يوم — ينتهي ${formatDate(p.endDate)}`
                                : `ينتهي ${formatDate(p.endDate)}`}
                            </span>
                          )}
                          {p.overdueTasks > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                              {p.overdueTasks} مهمة متأخرة
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
