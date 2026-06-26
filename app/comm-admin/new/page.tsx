"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Check, Upload, X, FileText } from "lucide-react";

const steps = ["تفاصيل التذكرة", "المرفقات", "التأكيد"];

const typeOptions = [
  { value: "SUPPORT",       label: "دعم فني",        icon: "🛠️", desc: "مشاكل تقنية، أجهزة، شبكة",     needsApproval: false },
  { value: "SHIFA_SUPPORT", label: "دعم فني - شفاء", icon: "🏥", desc: "طلبات فريق شفاء",               needsApproval: false },
  { value: "DEVELOPMENT",   label: "تطوير",           icon: "💻", desc: "تطوير أنظمة أو برمجيات",        needsApproval: true },
];

const priorityOptions = [
  { value: "LOW",      label: "منخفضة", desc: "لا يوجد تأثير على العمل",  border: "#86efac", bg: "#f0fdf4", fg: "#16a34a" },
  { value: "MEDIUM",   label: "متوسطة", desc: "تأثير محدود على العمل",    border: "#6fb54a", bg: "#e0f1d0", fg: "#00805b" },
  { value: "HIGH",     label: "عالية",  desc: "يؤثر على الإنتاجية",       border: "#fb923c", bg: "#fff7ed", fg: "#ea580c" },
  { value: "CRITICAL", label: "حرجة",   desc: "توقف تام عن العمل",        border: "#f87171", bg: "#fef2f2", fg: "#dc2626" },
];

export default function CommAdminNewTicketPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [files,   setFiles]   = useState<File[]>([]);
  const [form,    setForm]    = useState({ title: "", description: "", type: "", priority: "MEDIUM", requiresApproval: false });

  const setType = (val: string) => {
    const opt = typeOptions.find(t => t.value === val);
    setForm({ ...form, type: val, requiresApproval: opt?.needsApproval ?? false });
  };

  const nextStep = () => {
    if (step === 0) {
      if (!form.title.trim())       { toast.error("الرجاء إدخال عنوان التذكرة"); return; }
      if (!form.description.trim()) { toast.error("الرجاء وصف المشكلة"); return; }
      if (!form.type)               { toast.error("الرجاء اختيار نوع التذكرة"); return; }
    }
    setStep(s => Math.min(s + 1, 2));
  };

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    Array.from(fl).forEach(f => {
      if (f.size > 2 * 1024 * 1024) { toast.error(`${f.name}: أكبر من 2MB`); return; }
      setFiles(p => [...p, f]);
    });
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const ticket = await res.json();
      if (files.length) {
        const fd = new FormData();
        files.forEach(f => fd.append("files", f));
        await fetch(`/api/tickets/${ticket.id}/attachments`, { method: "POST", body: fd });
      }
      toast.success(`تم رفع التذكرة ${ticket.ticketNo}`);
      router.push(`/comm-admin/tickets/${ticket.id}`);
    } catch {
      toast.error("حدث خطأ أثناء رفع التذكرة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? "" : "opacity-40"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2"
                style={{ background: i < step ? "#6fb54a" : "#fff", borderColor: i <= step ? "#6fb54a" : "#d1d5db", color: i < step ? "#fff" : i === step ? "#6fb54a" : "#9ca3af" }}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block" style={{ color: i <= step ? "#00805b" : "#9ca3af" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-0.5 mx-3" style={{ background: i < step ? "#6fb54a" : "#e5e7eb" }} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900">تفاصيل التذكرة</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">عنوان الطلب *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان التذكرة"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">وصف الطلب *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4} placeholder="اشرح الطلب بالتفصيل..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلب *</label>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map(t => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className="p-4 rounded-xl border-2 text-right transition-all"
                    style={{ borderColor: form.type === t.value ? "#6fb54a" : "#e5e7eb", background: form.type === t.value ? "#e0f1d0" : "#fff" }}>
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="font-semibold text-sm" style={{ color: form.type === t.value ? "#00805b" : "#111827" }}>{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                    {t.needsApproval && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fef3c7", color: "#d97706" }}>يتطلب اعتماد</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map(p => (
                  <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                    className="p-3 rounded-xl border-2 text-right transition-all"
                    style={{ borderColor: form.priority === p.value ? p.border : "#e5e7eb", background: form.priority === p.value ? p.bg : "#fff" }}>
                    <div className="text-sm font-semibold" style={{ color: form.priority === p.value ? p.fg : "#374151" }}>{p.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900">المرفقات (اختياري)</h2>
            <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-green-50/50"
              style={{ borderColor: "#6fb54a" }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#6fb54a" }} />
              <p className="text-sm text-gray-700">اسحب الملفات هنا أو اضغط للاختيار</p>
              <p className="text-xs text-gray-400 mt-1">الحد الأقصى 2MB لكل ملف</p>
              <input ref={fileRef} type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={e => addFiles(e.target.files)} />
            </div>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <FileText className="w-5 h-5" style={{ color: "#6fb54a" }} />
                    <span className="flex-1 text-sm truncate">{f.name}</span>
                    <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-red-400"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900">مراجعة وتأكيد</h2>
            <div className="rounded-xl p-4 space-y-3" style={{ background: "#f4f4f5" }}>
              {[
                { label: "العنوان",   value: form.title },
                { label: "النوع",     value: typeOptions.find(t => t.value === form.type)?.label },
                { label: "الأولوية", value: priorityOptions.find(p => p.value === form.priority)?.label },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-semibold text-gray-900">{r.value}</span>
                </div>
              ))}
              {form.requiresApproval && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الاعتماد</span>
                  <span className="font-semibold" style={{ color: "#d97706" }}>يتطلب اعتماد</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-400 mb-1">الوصف</p>
                <p className="text-sm text-gray-700">{form.description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">
              <ChevronRight className="w-4 h-4" />السابق
            </button>
          )}
          {step < 2 ? (
            <button onClick={nextStep} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white mr-auto" style={{ background: "#6fb54a" }}>
              التالي<ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mr-auto"
              style={{ background: "linear-gradient(135deg,#6fb54a,#00805b)" }}>
              {loading ? "جارٍ الإرسال..." : "إرسال التذكرة ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
