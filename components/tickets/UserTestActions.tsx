"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props { ticketId: string; }

export default function UserTestActions({ ticketId }: Props) {
  const router = useRouter();
  const [loading,    setLoading]    = useState<"pass" | "fail" | null>(null);
  const [showFail,   setShowFail]   = useState(false);
  const [note,       setNote]       = useState("");

  const act = async (action: "pass" | "fail") => {
    if (action === "fail" && !note.trim()) {
      toast.error("يرجى وصف المشكلة");
      return;
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/user-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "pass" ? "تم إرسالها لتقنية المعلومات للإطلاق" : "تم إبلاغ تقنية المعلومات بالمشكلة");
      router.refresh();
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مجدداً");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)" }}>
      <div>
        <h3 className="font-bold" style={{ color: "#1F1535" }}>اختبار قبل الإطلاق</h3>
        <p className="text-sm mt-1" style={{ color: "#7C6A9E" }}>التطوير انتهى — جرّب التذكرة وأخبرنا بالنتيجة قبل ما نطلقها.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => act("pass")}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          {loading === "pass" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          تم الاختبار بنجاح
        </button>

        <button
          onClick={() => setShowFail(v => !v)}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <XCircle className="w-4 h-4" />
          فيه مشكلة
        </button>
      </div>

      {showFail && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <label className="block text-sm font-medium" style={{ color: "#991B1B" }}>
            وصف المشكلة (يُرسل لتقنية المعلومات) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="وش صار بالضبط وش المتوقع..."
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            style={{ border: "1px solid #FECACA", background: "#FFFFFF", color: "#1F1535" }}
          />
          <button
            onClick={() => act("fail")}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#DC2626" }}>
            {loading === "fail" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            إرسال المشكلة
          </button>
        </div>
      )}
    </div>
  );
}
