"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Layers, Trash2, Calendar, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  color: string;
  createdBy: { name: string };
  createdAt: string;
  columnCount: number;
  cardCount: number;
}

const COLORS = [
  "#7C3AED", "#EC4899", "#2563EB", "#16A34A",
  "#D97706", "#DC2626", "#0891B2", "#7C3AED",
];

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
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [color, setColor]       = useState(COLORS[0]);
  const [saving, setSaving]     = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, color }),
      });
      if (!res.ok) throw new Error();
      const p = await res.json();
      toast.success("تم إنشاء المشروع");
      setShowCreate(false);
      setTitle(""); setDesc(""); setColor(COLORS[0]);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1F1535" }}>لوحة المشاريع</h1>
          <p className="text-sm mt-0.5" style={{ color: "#7C6A9E" }}>
            تتبع المهام والمشاريع بين الفرق
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          <Plus className="w-4 h-4" />
          مشروع جديد
        </button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(124,58,237,0.1)" }}>
            <LayoutGrid className="w-8 h-8" style={{ color: "#7C3AED" }} />
          </div>
          <p className="font-semibold" style={{ color: "#1F1535" }}>لا توجد مشاريع بعد</p>
          <p className="text-sm mt-1" style={{ color: "#7C6A9E" }}>أنشئ أول مشروع لبدء التتبع</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            إنشاء مشروع
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link key={p.id} href={`/kanban/${p.id}`}
              className="group relative rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
              {/* Color strip */}
              <div className="absolute top-0 right-0 left-0 h-1 rounded-t-2xl" style={{ background: p.color }} />

              {/* Delete btn */}
              <button
                onClick={e => handleDelete(p.id, e)}
                className="absolute top-3 left-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                title="حذف المشروع">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>

              <div className="flex items-start gap-3 mt-2">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: p.color + "20" }}>
                  <Layers className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate" style={{ color: "#1F1535" }}>{p.title}</h3>
                  {p.description && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#7C6A9E" }}>{p.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid #F3EEFF" }}>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#1F1535" }}>{p.columnCount}</p>
                  <p className="text-xs" style={{ color: "#7C6A9E" }}>عمود</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#1F1535" }}>{p.cardCount}</p>
                  <p className="text-xs" style={{ color: "#7C6A9E" }}>بطاقة</p>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {p.createdBy.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    <Calendar className="w-3 h-3" />
                    {new Date(p.createdAt).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.25)" }}>
            <h2 className="font-bold text-white mb-5">مشروع جديد</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#A78BFA" }}>
                  اسم المشروع *
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.3)" }}
                  placeholder="مثال: تطوير الموقع الإلكتروني"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#A78BFA" }}>
                  الوصف (اختياري)
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.3)" }}
                  placeholder="وصف مختصر للمشروع..."
                  rows={2}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#A78BFA" }}>
                  لون المشروع
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: c,
                        outline: color === c ? `3px solid white` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {saving ? "جارٍ الإنشاء..." : "إنشاء المشروع"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A78BFA" }}>
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
