"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Layers, Trash2, Calendar, LayoutGrid, Clock, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  color: string;
  startDate?: string | null;
  endDate?: string | null;
  createdBy: { name: string };
  createdAt: string;
  columnCount: number;
  cardCount: number;
}

const COLORS = [
  "#7C3AED", "#EC4899", "#2563EB", "#16A34A",
  "#D97706", "#DC2626", "#0891B2", "#0F766E",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getProjectStatus(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) return null;
  const now  = Date.now();
  const end  = endDate  ? new Date(endDate).getTime()  : null;
  const start = startDate ? new Date(startDate).getTime() : null;

  if (end && now > end)          return "overdue";
  if (start && now < start)      return "upcoming";
  return "active";
}

function getProgressPct(startDate?: string | null, endDate?: string | null): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const now   = Date.now();
  if (now <= start) return 0;
  if (now >= end)   return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function daysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric", calendar: "gregory" });
}

const STATUS_META = {
  active:   { label: "جارٍ",    color: "#16A34A", bg: "#D1FAE5", icon: Clock },
  upcoming: { label: "قادم",    color: "#2563EB", bg: "#DBEAFE", icon: Calendar },
  overdue:  { label: "متأخر",   color: "#DC2626", bg: "#FEF2F2", icon: AlertCircle },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectsClient({
  projects: initial,
  currentUserId,
  isAdmin,
}: {
  projects: Project[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [title,     setTitle]     = useState("");
  const [desc,      setDesc]      = useState("");
  const [color,     setColor]     = useState(COLORS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [saving,    setSaving]    = useState(false);

  const resetForm = () => {
    setTitle(""); setDesc(""); setColor(COLORS[0]);
    setStartDate(""); setEndDate("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, color, startDate: startDate || null, endDate: endDate || null }),
      });
      if (!res.ok) throw new Error();
      const p = await res.json();
      toast.success("تم إنشاء المشروع");
      setShowCreate(false);
      resetForm();
      router.push(`/kanban/${p.id}`);
    } catch {
      toast.error("فشل إنشاء المشروع");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("هل تريد حذف هذا المشروع وجميع بطاقاته؟")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("تم حذف المشروع");
    } else {
      toast.error("فشل الحذف");
    }
  };

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1F1535" }}>
            لوحة المشاريع
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7C6A9E" }}>
            {projects.length > 0
              ? `${projects.length} مشروع — تتبع المهام والمشاريع بين الفرق`
              : "تتبع المهام والمشاريع بين الفرق"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          <Plus className="w-4 h-4" />
          مشروع جديد
        </button>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "مشاريع نشطة",
              value: projects.filter(p => getProjectStatus(p.startDate, p.endDate) === "active").length,
              color: "#16A34A", bg: "#D1FAE5",
            },
            {
              label: "إجمالي البطاقات",
              value: projects.reduce((s, p) => s + p.cardCount, 0),
              color: "#7C3AED", bg: "#EDE9FE",
            },
            {
              label: "متأخرة",
              value: projects.filter(p => getProjectStatus(p.startDate, p.endDate) === "overdue").length,
              color: "#DC2626", bg: "#FEF2F2",
            },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: k.bg }}>
                <span className="text-lg font-bold" style={{ color: k.color }}>{k.value}</span>
              </div>
              <p className="text-sm font-medium" style={{ color: "#7C6A9E" }}>{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Projects grid ────────────────────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #C4B5FD" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(124,58,237,0.08)" }}>
            <LayoutGrid className="w-8 h-8" style={{ color: "#7C3AED" }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: "#1F1535" }}>لا توجد مشاريع بعد</p>
          <p className="text-sm mb-5" style={{ color: "#7C6A9E" }}>أنشئ أول مشروع لبدء التتبع مع فريقك</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            <Plus className="w-4 h-4" />
            إنشاء أول مشروع
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => {
            const status  = getProjectStatus(p.startDate, p.endDate);
            const pct     = getProgressPct(p.startDate, p.endDate);
            const daysLeft = daysRemaining(p.endDate);
            const sm      = status ? STATUS_META[status] : null;
            const StatusIcon = sm?.icon;

            return (
              <Link key={p.id} href={`/kanban/${p.id}`}
                className="group relative rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1"
                style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>

                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ background: p.color }} />

                {/* Card body */}
                <div className="p-5 flex-1">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{ background: p.color + "18" }}>
                        <Layers className="w-5 h-5" style={{ color: p.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base leading-tight truncate" style={{ color: "#1F1535" }}>
                          {p.title}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                          بواسطة {p.createdBy.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {sm && StatusIcon && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: sm.bg, color: sm.color }}>
                          <StatusIcon className="w-3 h-3" />
                          {sm.label}
                        </span>
                      )}
                      <button
                        onClick={e => handleDelete(p.id, e)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                        title="حذف المشروع">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-sm mb-4 leading-relaxed line-clamp-2" style={{ color: "#7C6A9E" }}>
                      {p.description}
                    </p>
                  )}

                  {/* Date range */}
                  {(p.startDate || p.endDate) && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-4">
                          {p.startDate && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: "#7C6A9E" }}>
                              <Calendar className="w-3 h-3" />
                              <span>بدأ {formatDate(p.startDate)}</span>
                            </div>
                          )}
                          {p.endDate && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: status === "overdue" ? "#DC2626" : "#7C6A9E" }}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {daysLeft !== null
                                  ? daysLeft > 0
                                    ? `${daysLeft} يوم متبقٍ`
                                    : `تأخر ${Math.abs(daysLeft)} يوم`
                                  : formatDate(p.endDate)}
                              </span>
                            </div>
                          )}
                        </div>
                        {p.startDate && p.endDate && (
                          <span className="text-xs font-semibold" style={{ color: p.color }}>{pct}%</span>
                        )}
                      </div>
                      {p.startDate && p.endDate && (
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3EEFF" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: status === "overdue"
                                ? "linear-gradient(90deg,#DC2626,#EF4444)"
                                : `linear-gradient(90deg,${p.color},${p.color}99)`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid #F3EEFF", background: "#FDFCFF" }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-xs" style={{ color: "#7C6A9E" }}>
                        <span className="font-semibold" style={{ color: "#1F1535" }}>{p.columnCount}</span> عمود
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-xs" style={{ color: "#7C6A9E" }}>
                        <span className="font-semibold" style={{ color: "#1F1535" }}>{p.cardCount}</span> بطاقة
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-purple-300 group-hover:text-purple-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm(); } }}>
          <div
            className="dark-modal rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.3)" }}>

            {/* Modal header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(124,58,237,0.2)" }}>
                <LayoutGrid className="w-5 h-5" style={{ color: "#A78BFA" }} />
              </div>
              <div>
                <h2 className="font-bold text-white">مشروع جديد</h2>
                <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>أضف تفاصيل المشروع</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                  اسم المشروع *
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" }}
                  placeholder="مثال: تطوير الموقع الإلكتروني"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                  الوصف
                </label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" }}
                  placeholder="وصف مختصر للمشروع وأهدافه..."
                  rows={2}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)", colorScheme: "dark" }}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)", colorScheme: "dark" }}
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                  لون المشروع
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                      style={{
                        background: c,
                        boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
                {/* Preview */}
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: color + "15", border: `1px solid ${color}33` }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color }}>
                    {title.trim() || "اسم المشروع"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {saving ? "جارٍ الإنشاء..." : "إنشاء المشروع"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#A78BFA" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
