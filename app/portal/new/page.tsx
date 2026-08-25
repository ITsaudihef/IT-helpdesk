"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Check, Upload, X, FileText, HelpCircle } from "lucide-react";

const GUIDE_URL = "/user-guide.pdf";

const steps = ["تفاصيل التذكرة", "المرفقات", "التأكيد"];

const typeOptions = [
  { value: "SUPPORT",       label: "دعم فني",         icon: "🛠️", desc: "مشاكل تقنية، أجهزة، شبكة، صلاحيات" },
  { value: "SHIFA_SUPPORT", label: "دعم فني - شفاء",  icon: "🏥", desc: "طلبات الدعم الموجهة لفريق شفاء" },
  { value: "DEVELOPMENT",   label: "تطوير",            icon: "💻", desc: "طلبات تطوير أنظمة أو برمجيات — يتطلب اعتماد" },
  { value: "PERMISSIONS",   label: "الصلاحيات",        icon: "🔑", desc: "إضافة أو حذف صلاحية مستخدم — يتطلب اعتماد" },
];

const permissionActionOptions = [
  { value: "ADD", label: "إضافة" },
  { value: "DELETE", label: "حذف" },
];

const priorityOptions = [
  { value: "LOW",      label: "منخفضة", desc: "لا يوجد تأثير على العمل",  border: "#86efac", bg: "rgba(34,197,94,0.1)", fg: "#16A34A" },
  { value: "MEDIUM",   label: "متوسطة", desc: "تأثير محدود على العمل",    border: "#007F5C", bg: "rgba(0,127,92,0.12)", fg: "#00543D" },
  { value: "HIGH",     label: "عالية",  desc: "يؤثر على الإنتاجية",       border: "#fb923c", bg: "rgba(249,115,22,0.1)", fg: "#EA580C" },
  { value: "CRITICAL", label: "حرجة",   desc: "توقف تام عن العمل",        border: "#f87171", bg: "rgba(239,68,68,0.1)", fg: "#DC2626" },
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
    approvalChainChange: false, approvalChainJustification: "", affectedScreen: "",
    permissionAction: "", permissionName: "", permissionHolderName: "", permissionHolderPhone: "", permissionHolderEmail: "",
  });

  const setType = (val: string) =>
    setForm({ ...form, type: val, requiresApproval: val === "DEVELOPMENT" || val === "PERMISSIONS" });

  const nextStep = () => {
    if (step === 0) {
      if (!form.title.trim())       { toast.error("الرجاء إدخال عنوان التذكرة"); return; }
      if (!form.description.trim()) { toast.error("الرجاء وصف المشكلة"); return; }
      if (!form.type)               { toast.error("الرجاء اختيار نوع التذكرة"); return; }
      if (form.type === "DEVELOPMENT" && form.approvalChainChange && !form.approvalChainJustification.trim()) {
        toast.error("الرجاء كتابة مبرر تعديل سلسلة الاعتماد"); return;
      }
      if (form.type === "PERMISSIONS") {
        if (!form.permissionAction)              { toast.error("الرجاء اختيار إضافة أو حذف"); return; }
        if (!form.permissionName.trim())         { toast.error("الرجاء إدخال اسم الصلاحية"); return; }
        if (!form.permissionHolderName.trim())   { toast.error("الرجاء إدخال اسم صاحب الصلاحية"); return; }
        if (!form.permissionHolderPhone.trim())  { toast.error("الرجاء إدخال رقم جوال صاحب الصلاحية"); return; }
        if (!form.permissionHolderEmail.trim())  { toast.error("الرجاء إدخال إيميل صاحب الصلاحية"); return; }
      }
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
      {/* Guide link */}
      <div className="flex justify-end mb-4">
        <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:shadow-sm"
          style={{ background: "rgba(0,127,92,0.1)", color: "#00543D", border: "1px solid #BFE0B6" }}>
          <HelpCircle className="w-4 h-4" style={{ color: "#007F5C" }} />
          دليل إنشاء التذاكر
        </a>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? "" : "opacity-40"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                style={{
                  background:  i < step ? "#007F5C" : "#fff",
                  borderColor: i <= step ? "#007F5C" : "#d1d5db",
                  color:       i < step ? "#fff" : i === step ? "#007F5C" : "#9ca3af",
                }}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block"
                style={{ color: i <= step ? "#00543D" : "#9ca3af" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 transition-all"
                style={{ background: i < step ? "#007F5C" : "#e5e7eb" }} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #DCEAD9" }}>

        {/* ── Step 1: Details ── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "#16241D" }}>تفاصيل التذكرة</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">عنوان الطلب *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: مشكلة في الوصول لنظام الحضور"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" style={{ border: "1px solid #BFE0B6", background: "#FAFAFA", color: "#16241D" }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">وصف الطلب *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} placeholder="اشرح طلبك بالتفصيل..."
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" style={{ border: "1px solid #BFE0B6", background: "#FAFAFA", color: "#16241D" }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلب *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {typeOptions.map((t) => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className="p-4 rounded-xl border-2 text-right transition-all"
                    style={{
                      borderColor: form.type === t.value ? "#007F5C" : "#e5e7eb",
                      background:  form.type === t.value ? "rgba(0,127,92,0.12)" : "#fff",
                    }}>
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <div className="font-semibold text-sm" style={{ color: form.type === t.value ? "#00543D" : "#111827" }}>
                      {t.label}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">{t.desc}</div>
                    {(t.value === "DEVELOPMENT" || t.value === "PERMISSIONS") && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#FEF3C7", color: "#92400E" }}>
                        يتطلب اعتماد
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((p) => (
                  <button key={p.value} type="button"
                    onClick={() => {
                      if (p.value === "CRITICAL") toast("تأكد أن المشكلة تستوجب أولوية حرجة فعلاً — توقف تام عن العمل", { icon: "⚠️" });
                      setForm({ ...form, priority: p.value });
                    }}
                    className="p-3 rounded-xl border-2 text-right transition-all"
                    style={{
                      borderColor: form.priority === p.value ? p.border : "#e5e7eb",
                      background:  form.priority === p.value ? p.bg   : "#fff",
                    }}>
                    <div className="text-sm font-semibold"
                      style={{ color: form.priority === p.value ? p.fg : "#374151" }}>{p.label}</div>
                    <div className="text-xs text-purple-600 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Development-only fields */}
            {form.type === "DEVELOPMENT" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">هل يوجد تعديل في سلسلة اعتماد؟ *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: true, l: "نعم" }, { v: false, l: "لا" }].map((o) => (
                      <button key={String(o.v)} type="button"
                        onClick={() => setForm({ ...form, approvalChainChange: o.v, approvalChainJustification: o.v ? form.approvalChainJustification : "" })}
                        className="p-3 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={{
                          borderColor: form.approvalChainChange === o.v ? "#007F5C" : "#e5e7eb",
                          background:  form.approvalChainChange === o.v ? "rgba(0,127,92,0.12)" : "#fff",
                          color:       form.approvalChainChange === o.v ? "#00543D" : "#374151",
                        }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {form.approvalChainChange && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">مبرر تعديل سلسلة الاعتماد *</label>
                    <textarea value={form.approvalChainJustification}
                      onChange={(e) => setForm({ ...form, approvalChainJustification: e.target.value })}
                      rows={3} placeholder="اشرح سبب الحاجة لتعديل سلسلة الاعتماد..."
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      style={{ border: "1px solid #BFE0B6", background: "#FAFAFA", color: "#16241D" }} />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الشاشة والصلاحية المتأثرة</label>
                  <input value={form.affectedScreen}
                    onChange={(e) => setForm({ ...form, affectedScreen: e.target.value })}
                    placeholder="مثال: شاشة إدارة المستخدمين — صلاحية الاعتماد"
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #BFE0B6", background: "#FAFAFA", color: "#16241D" }} />
                </div>
              </>
            )}

            {/* Permissions-only fields */}
            {form.type === "PERMISSIONS" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الإجراء المطلوب *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {permissionActionOptions.map((o) => (
                      <button key={o.value} type="button"
                        onClick={() => setForm({ ...form, permissionAction: o.value })}
                        className="p-3 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={{
                          borderColor: form.permissionAction === o.value ? "#007F5C" : "#e5e7eb",
                          background:  form.permissionAction === o.value ? "rgba(0,127,92,0.12)" : "#fff",
                          color:       form.permissionAction === o.value ? "#00543D" : "#374151",
                        }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الصلاحية *</label>
                  <input value={form.permissionName}
                    onChange={(e) => setForm({ ...form, permissionName: e.target.value })}
                    placeholder="مثال: صلاحية اعتماد الحجوزات"
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #BFE0B6", background: "#FAFAFA", color: "#16241D" }} />
                </div>

                <div className="rounded-xl p-4" style={{ background: "#F3F7F1", border: "1px solid #DCEAD9" }}>
                  <p className="text-sm font-medium text-gray-700 mb-3">بيانات صاحب الصلاحية</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">الاسم *</label>
                      <input value={form.permissionHolderName}
                        onChange={(e) => setForm({ ...form, permissionHolderName: e.target.value })}
                        placeholder="اسم صاحب الصلاحية"
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        style={{ border: "1px solid #BFE0B6", background: "#FFFFFF", color: "#16241D" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">رقم الجوال *</label>
                      <input type="tel" value={form.permissionHolderPhone}
                        onChange={(e) => setForm({ ...form, permissionHolderPhone: e.target.value })}
                        placeholder="05xxxxxxxx"
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        style={{ border: "1px solid #BFE0B6", background: "#FFFFFF", color: "#16241D" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">الإيميل *</label>
                      <input type="email" value={form.permissionHolderEmail}
                        onChange={(e) => setForm({ ...form, permissionHolderEmail: e.target.value })}
                        placeholder="example@saudihef.org.sa"
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        style={{ border: "1px solid #BFE0B6", background: "#FFFFFF", color: "#16241D" }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Attachments ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "#16241D" }}>المرفقات (اختياري)</h2>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:bg-purple-50"
              style={{ borderColor: "#007F5C" }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#007F5C" }} />
              <p className="text-sm font-medium text-gray-700">اسحب الملفات هنا أو اضغط للاختيار</p>
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
                  <li key={i} className="flex items-center gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50">
                    <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "#007F5C" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#16241D" }}>{f.name}</p>
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
            <h2 className="text-lg font-bold" style={{ color: "#16241D" }}>مراجعة وتأكيد</h2>
            <div className="rounded-xl p-4 space-y-3" style={{ background: "#F3F7F1", border: "1px solid #DCEAD9" }}>
              {[
                { label: "العنوان",   value: form.title },
                { label: "النوع",     value: typeOptions.find((t) => t.value === form.type)?.label },
                { label: "الأولوية", value: priorityOptions.find((p) => p.value === form.priority)?.label },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-purple-600">{r.label}</span>
                  <span className="font-semibold" style={{ color: "#16241D" }}>{r.value}</span>
                </div>
              ))}
              {form.requiresApproval && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">الاعتماد</span>
                  <span className="font-semibold" style={{ color: "#B45309" }}>يتطلب اعتماد الإدارة</span>
                </div>
              )}
              {form.type === "DEVELOPMENT" && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">تعديل سلسلة الاعتماد</span>
                  <span className="font-semibold" style={{ color: "#16241D" }}>{form.approvalChainChange ? "نعم" : "لا"}</span>
                </div>
              )}
              {form.approvalChainChange && form.approvalChainJustification && (
                <div className="pt-2 border-t border-purple-100">
                  <p className="text-xs text-purple-500 mb-1">مبرر تعديل سلسلة الاعتماد</p>
                  <p className="text-sm text-gray-700">{form.approvalChainJustification}</p>
                </div>
              )}
              {form.affectedScreen && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">الشاشة والصلاحية المتأثرة</span>
                  <span className="font-semibold" style={{ color: "#16241D" }}>{form.affectedScreen}</span>
                </div>
              )}
              {form.type === "PERMISSIONS" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">الإجراء</span>
                    <span className="font-semibold" style={{ color: "#16241D" }}>
                      {permissionActionOptions.find((o) => o.value === form.permissionAction)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">اسم الصلاحية</span>
                    <span className="font-semibold" style={{ color: "#16241D" }}>{form.permissionName}</span>
                  </div>
                  <div className="pt-2 border-t border-purple-100">
                    <p className="text-xs text-purple-500 mb-1">صاحب الصلاحية</p>
                    <p className="text-sm text-gray-700">
                      {form.permissionHolderName} — {form.permissionHolderPhone} — {form.permissionHolderEmail}
                    </p>
                  </div>
                </>
              )}
              {files.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">المرفقات</span>
                  <span className="font-semibold" style={{ color: "#16241D" }}>{files.length} ملف</span>
                </div>
              )}
              <div className="pt-2 border-t border-purple-100">
                <p className="text-xs text-purple-500 mb-1">الوصف</p>
                <p className="text-sm text-gray-700">{form.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-lg text-sm text-gray-700 hover:bg-purple-50">
              <ChevronRight className="w-4 h-4" />السابق
            </button>
          )}
          {step < 2 ? (
            <button onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white mr-auto"
              style={{ background: "#007F5C" }}>
              التالي<ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mr-auto"
              style={{ background: loading ? "#9dd274" : "linear-gradient(135deg,#007F5C,#6FB449)" }}>
              {loading ? "جارٍ الإرسال..." : "إرسال التذكرة ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
