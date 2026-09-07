"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DeptRow {
  name: string;
  total: number;
  inProgress: number;
  pendingApproval: number;
  done: number;
  critical: number;
}

interface ProjectRow {
  id: string;
  title: string;
  progressPct: number;
  cardTotal: number;
  cardDone: number;
  startDate: string | null;
  endDate: string | null;
  status: "متأخر" | "قادم" | "نشط";
  memberCount: number;
}

interface ProjectDeptGroup {
  name: string;
  projects: ProjectRow[];
  avgProgress: number;
}

interface ExecutiveSummary {
  total: number;
  critical: number;
  avgResolutionHours: number;
  departmentCount: number;
  statusBreakdown: Record<string, number>;
  departments: DeptRow[];
  monthlyTrend: { month: string; created: number; resolved: number }[];
  projectCount: number;
  projectsByDepartment: ProjectDeptGroup[];
}

const PROJECT_STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  "نشط":   { bg: "#E3F2E0", fg: "#00543D" },
  "متأخر": { bg: "#FEE2E2", fg: "#DC2626" },
  "قادم":  { bg: "#F1F5F9", fg: "#475569" },
};

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

  const maxDeptTotal = Math.max(...summary.departments.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Top KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "إجمالي التذاكر",     value: summary.total,                    fg: "#00543D", bg: "#E3F2E0" },
          { label: "حرجة وغير محلولة",   value: summary.critical,                 fg: "#DC2626", bg: "#FEE2E2" },
          { label: "متوسط وقت الحل",     value: `${summary.avgResolutionHours}س`, fg: "#92400E", bg: "#FEF3C7" },
          { label: "عدد الإدارات",       value: summary.departmentCount,          fg: "#1D4ED8", bg: "#DBEAFE" },
          { label: "إجمالي المشاريع",    value: summary.projectCount,             fg: "#7E22CE", bg: "#F3E8FF" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-purple-100 p-4" style={{ background: "#FFFFFF" }}>
            <p className="text-2xl font-bold" style={{ color: k.fg }}>{k.value}</p>
            <p className="text-xs text-purple-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Monthly Trend ── */}
      {summary.monthlyTrend.length > 0 && (
        <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
          <h3 className="font-bold mb-4" style={{ color: "#16241D" }}>الاتجاه الشهري — آخر 6 أشهر</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={summary.monthlyTrend}>
              <defs>
                <linearGradient id="execGradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#007F5C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#007F5C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="execGradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="created"  name="واردة"  stroke="#007F5C" fill="url(#execGradCreated)"  strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" name="محلولة" stroke="#22c55e" fill="url(#execGradResolved)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Department Workflow Chart ── */}
      {summary.departments.length > 0 && (
        <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
          <h3 className="font-bold mb-4" style={{ color: "#16241D" }}>سير عمل التذاكر حسب الإدارة</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, summary.departments.length * 44)}>
            <BarChart data={summary.departments} layout="vertical" stackOffset="none">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Legend />
              <Bar dataKey="inProgress"      name="قيد التنفيذ"        stackId="s" fill="#007F5C" />
              <Bar dataKey="pendingApproval" name="بانتظار الاعتماد"   stackId="s" fill="#F59E0B" />
              <Bar dataKey="done"            name="محلولة / مغلقة"     stackId="s" fill="#94A3B8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Department Table ── */}
      <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
        <h3 className="font-bold mb-4" style={{ color: "#16241D" }}>تفاصيل الإدارات</h3>
        {summary.departments.length === 0 ? (
          <p className="text-sm text-purple-500 text-center py-8">لا توجد بيانات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #DCEAD9" }}>
                  {["الإدارة", "الإجمالي", "قيد التنفيذ", "بانتظار الاعتماد", "محلولة/مغلقة", "حرجة"].map((h) => (
                    <th key={h} className="text-right py-2 px-3 text-xs font-semibold" style={{ color: "#007F5C" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.departments.map((d) => {
                  const pct = Math.round((d.total / maxDeptTotal) * 100);
                  return (
                    <tr key={d.name} style={{ borderBottom: "1px solid #F3EEFF" }} className="transition-colors hover:bg-purple-50">
                      <td className="py-3 px-3 font-medium" style={{ color: "#16241D" }}>
                        <div className="flex items-center gap-2">
                          <span>{d.name}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: "#DCEAD9" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#007F5C" }} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold" style={{ color: "#16241D" }}>{d.total}</td>
                      <td className="py-3 px-3 text-center" style={{ color: "#00543D" }}>{d.inProgress}</td>
                      <td className="py-3 px-3 text-center" style={{ color: "#B45309" }}>{d.pendingApproval}</td>
                      <td className="py-3 px-3 text-center" style={{ color: "#475569" }}>{d.done}</td>
                      <td className="py-3 px-3 text-center">
                        {d.critical > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>{d.critical}</span>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Projects by Department ── */}
      <div className="rounded-xl border border-purple-100 p-5" style={{ background: "#FFFFFF" }}>
        <h3 className="font-bold mb-1" style={{ color: "#16241D" }}>المشاريع حسب الإدارة</h3>
        <p className="text-xs text-purple-400 mb-4">مستوى التقدم محسوب من نسبة المهام المكتملة في كل مشروع</p>
        {summary.projectsByDepartment.length === 0 ? (
          <p className="text-sm text-purple-500 text-center py-8">لا توجد مشاريع بعد</p>
        ) : (
          <div className="space-y-5">
            {summary.projectsByDepartment.map((dept) => (
              <div key={dept.name} className="rounded-xl border p-4" style={{ borderColor: "#DCEAD9", background: "#FBFCFA" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: "#16241D" }}>{dept.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#E3F2E0", color: "#00543D" }}>
                      {dept.projects.length} مشروع
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#55705F" }}>متوسط التقدم</span>
                    <span className="text-sm font-bold" style={{ color: "#007F5C" }}>{dept.avgProgress}%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {dept.projects.map((p) => {
                    const st = PROJECT_STATUS_STYLE[p.status];
                    return (
                      <div key={p.id} className="rounded-lg p-3" style={{ background: "#FFFFFF", border: "1px solid #F3EEFF" }}>
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className="text-sm font-medium truncate" style={{ color: "#16241D" }}>{p.title}</span>
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
                        <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>
                          {p.cardDone}/{p.cardTotal} مهمة مكتملة · {p.memberCount} أعضاء
                        </p>
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
