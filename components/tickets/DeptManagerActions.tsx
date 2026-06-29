"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props { ticketId: string; }

export default function DeptManagerActions({ ticketId }: Props) {
  const router = useRouter();
  const [loading,   setLoading]   = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [note,       setNote]       = useState("");

  const act = async (action: "approve" | "reject") => {
    if (action === "reject" && !note.trim()) {
      toast.error("يرجى كتابة سبب الإعادة");
      return;
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/dept-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "approve" ? "تم الاعتماد وإرساله للفريق التقني" : "تم إعادة الطلب للمستخدم");
      router.push("/dept-manager");
      router.refresh();
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مجدداً");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <h3 className="font-bold" style={{ color: "#1F1535" }}>إجراء الاعتماد</h3>

      <div className="flex gap-3 flex-wrap">
        {/* Approve */}
        <button
          onClick={() => act("approve")}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
          {loading === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          اعتماد وإرسال للتقنية
        </button>

        {/* Reject toggle */}
        <button
          onClick={() => setShowReject(v => !v)}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <XCircle className="w-4 h-4" />
          إعادة الطلب
        </button>
      </div>

      {/* Reject form */}
      {showReject && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <label className="block text-sm font-medium" style={{ color: "#991B1B" }}>
            سبب الإعادة (يُرسل للمستخدم) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="اكتب سبب إعادة الطلب بوضوح..."
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            style={{ border: "1px solid #FECACA", background: "#FFFFFF", color: "#1F1535" }}
          />
          <button
            onClick={() => act("reject")}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#DC2626" }}>
            {loading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            تأكيد الإعادة
          </button>
        </div>
      )}
    </div>
  );
}
