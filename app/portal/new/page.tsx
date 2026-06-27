"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Check, Upload, X, FileText } from "lucide-react";

const steps = ["تفاصيل التذكرة", "المرفقات", "التأكيد"];

const typeOptions = [
  { value: "SUPPORT",       label: "دعم فني",         icon: "🛠️", desc: "مشاكل تقنية، أجهزة، شبكة، صلاحيات" },
  { value: "SHIFA_SUPPORT", label: "دعم فني - شفاء",  icon: "🏥", desc: "طلبات الدعم الموجهة لفريق شفاء" },
  { value: "DEVELOPMENT",   label: "تطوير",            icon: "💻", desc: "طلبات تطوير أنظمة أو برمجيات — يتطلب اعتماد" },
];

const priorityOptions = [
  { value: "LOW",      label: "منخفضة", desc: "لا يوجد تأثير على العمل",  border: "#86efac", bg: "#f0fdf4", fg: "#16a34a" },
  { value: "MEDIUM",   label: "متوسطة", desc: "تأثير محدود على العمل",    border: "#7C3AED", bg: "rgba(124,58,237,0.12)", fg: "#5B21B6" },
  { value: "HIGH",     label: "عالية",  desc: "يؤثر على الإنتاجية",       border: "#fb923c", bg: "#fff7ed", fg: "#ea580c" },
  { value: "CRITICAL", label: "حرجة",   desc: "توقف تام عن العمل",        border: "#f87171", bg: "#fef2f2", fg: "#dc2626" },
];

const ALLOWED_EXTS = ["jpg","jpeg","png","gif","webp","pdf","doc","docx","xls","xlsx"];

export default function NewTicketPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [files,   setFiles]   = useState<File[]>([]);
  const [form,    setForm]    = useState({
    title: "", description: "", type: "", priority: "MEDIUM", requiresApproval: false,
  });

  const setType = (val: string) =>
    setForm({ ...form, type: val, requiresApproval: val === "DEVELOPMENT" });

  const nextStep = () => {
    if (step === 0) {
      if (!form.title.trim())       { toast.error("الرجاء إدخال عنوان التذكرة"); return; }
      if (!form.description.trim()) { toast.error("الرجاء وصف المشكلة"); return; }
      if (!form.type)               { toast.error("الرجاء اختيار نوع التذكرة"); return; }
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid: File[] = [];
    Array.from(incoming).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXTS.includes(ext)) { toast.error(`نوع الملف غير مدعوم: ${f.name}`); return; }
      if (f.size > 10 * 1024 * 1024)   { toast.error(`الملف أكبر من 10MB: ${f.name}`);  return; }
      valid.push(f);
    });
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const formatSize = (n: number) =>
    n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`;

  const submit = async () => {
    setLoading(true);
    try {
      // 1. Create ticket
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const ticket = await res.json();

      // 2. Upload attachments if any
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        await fetch(`/api/tickets/${ticket.id}/attachments`, { method: "POST", body: fd });
      }

      toast.success(`تم رفع التذكرة ${ticket.ticketNo} بنجاح`);
      router.push(`/portal/tickets/${ticket.id}`);
    } catch {
      toast.error("حدث خطأ أثناء رفع التذكرة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? "" : "opacity-40"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                style={{
                  background:  i < step ? "#7C3AED" : "#fff",
                  borderColor: i <= step ? "#7C3AED" : "#d1d5db",
                  color:       i < step ? "#fff" : i === step ? "#7C3AED" : "#9ca3af",
                }}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block"
                style={{ color: i <= step ? "#5B21B6" : "#9ca3af" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 transition-all"
                style={{ background: i < step ? "#7C3AED" : "#e5e7eb" }} />
            )}
          </div>
        ))}
      </div>

      <div <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }}>

        {/* ── Step 1: Details ── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">تفاصيل التذكرة</h2>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">عنوان الطلب *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: مشكلة في الوصول لنظام الحضور"
                className="w-full px-3 py-2.5 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#7C3AED" } as any} />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">وصف الطلب *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} placeholder="اشرح طلبك بالتفصيل..."
                className="w-full px-3 py-2.5 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ "--tw-ring-color": "#7C3AED" } as any} />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">نوع الطلب *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {typeOptions.map((t) => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className="p-4 rounded-xl border-2 text-right transition-all"
                    style={{
                      borderColor: form.type === t.value ? "#7C3AED" : "#e5e7eb",
                      background:  form.type === t.value ? "rgba(124,58,237,0.12)" : "#fff",
                    }}>
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <div className="font-semibold text-sm" style={{ color: form.type === t.value ? "#5B21B6" : "#111827" }}>
                      {t.label}
                    </div>
                    <div className="text-xs text-purple-400 mt-1">{t.desc}</div>
                    {t.value === "DEVELOPMENT" && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#fef3c7", color: "#d97706" }}>
                        يتطلب اعتماد
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">الأولوية</label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((p) => (
                  <button key={p.value} type="button"
                    onClick={() => setForm({ ...form, priority: p.value })}
                    className="p-3 rounded-xl border-2 text-right transition-all"
                    style={{
                      borderColor: form.priority === p.value ? p.border : "#e5e7eb",
                      background:  form.priority === p.value ? p.bg   : "#fff",
                    }}>
                    <div className="text-sm font-semibold"
                      style={{ color: form.priority === p.value ? p.fg : "#374151" }}>{p.label}</div>
                    <div className="text-xs text-purple-400 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Attachments ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">المرفقات (اختياري)</h2>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:bg-purple-900/20"
              style={{ borderColor: "#7C3AED" }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#7C3AED" }} />
              <p className="text-sm font-medium text-purple-200">اسحب الملفات هنا أو اضغط للاختيار</p>
              <p className="text-xs text-purple-500 mt-1">
                PNG، JPG، PDF، Word، Excel — حتى 10MB لكل ملف
              </p>
              <input ref={fileRef} type="file" multiple className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => addFiles(e.target.files)} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5">
                    <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "#7C3AED" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                      <p className="text-xs text-purple-500">{formatSize(f.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)}
                      className="p-1 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">مراجعة وتأكيد</h2>
            <div className="rounded-xl p-4 space-y-3" style={{ background: "#0a0320" }}>
              {[
                { label: "العنوان",   value: form.title },
                { label: "النوع",     value: typeOptions.find((t) => t.value === form.type)?.label },
                { label: "الأولوية", value: priorityOptions.find((p) => p.value === form.priority)?.label },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-purple-400">{r.label}</span>
                  <span className="font-semibold text-white">{r.value}</span>
                </div>
              ))}
              {form.requiresApproval && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400">الاعتماد</span>
                  <span className="font-semibold" style={{ color: "#d97706" }}>يتطلب اعتماد الإدارة</span>
                </div>
              )}
              {files.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400">المرفقات</span>
                  <span className="font-semibold text-white">{files.length} ملف</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/8">
                <p className="text-xs text-purple-500 mb-1">الوصف</p>
                <p className="text-sm text-purple-200">{form.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-2 border border-white/8 rounded-lg text-sm text-purple-200 hover:bg-white/5">
              <ChevronRight className="w-4 h-4" />السابق
            </button>
          )}
          {step < 2 ? (
            <button onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white mr-auto"
              style={{ background: "#7C3AED" }}>
              التالي<ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mr-auto"
              style={{ background: loading ? "#9dd274" : "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
              {loading ? "جارٍ الإرسال..." : "إرسال التذكرة ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
