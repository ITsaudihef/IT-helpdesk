"use client";

import { useState } from "react";
import { Send, Lock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Comment {
  id: string; body: string; isInternal: boolean; createdAt: string;
  author: { name: string; role: string };
}
interface Props { ticketId: string; comments: Comment[]; currentUserId: string; userRole: string; }

export default function TicketComments({ ticketId, comments: initial, currentUserId, userRole }: Props) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isInternal }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
      toast.success("تم إضافة التعليق");
    } catch { toast.error("حدث خطأ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <h2 className="font-bold mb-4" style={{ color: "#1F1535" }}>التعليقات ({comments.length})</h2>

      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "#7C3AED" }}>لا توجد تعليقات بعد</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl p-4 border"
            style={c.isInternal
              ? { background: "#FFFBEB", borderColor: "#FDE68A" }
              : { background: "#F9F7FF", borderColor: "#E9E3FF" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "#7C3AED" }}>
                  {c.author.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold" style={{ color: "#1F1535" }}>{c.author.name}</span>
                {c.isInternal && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#FEF3C7", color: "#92400E" }}>
                    <Lock className="w-3 h-3" />داخلي
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: "#7C6A9E" }}>{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب تعليقك هنا..." rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          style={{ background: "#F9F7FF", border: "1px solid #E9E3FF", color: "#1F1535" }} />
        <div className="flex items-center justify-between">
          {(userRole === "ADMIN" || userRole === "SUPPORT") && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: "#7C3AED" }} />
              <span className="text-sm" style={{ color: "#5B21B6" }}>تعليق داخلي</span>
            </label>
          )}
          <button type="submit" disabled={loading || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mr-auto"
            style={{ background: "#7C3AED" }}>
            <Send className="w-4 h-4" />
            {loading ? "جارٍ الإرسال..." : "إرسال"}
          </button>
        </div>
      </form>
    </div>
  );
}
