"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

interface Props { ticketId: string; currentRating: number | null; }

export default function TicketRating({ ticketId, currentRating }: Props) {
  const [rating, setRating] = useState(currentRating || 0);
  const [hover,  setHover]  = useState(0);
  const [saved,  setSaved]  = useState(!!currentRating);

  const save = async (val: number) => {
    if (saved) return;
    setRating(val);
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: val }),
      });
      setSaved(true);
      toast.success("شكراً على تقييمك!");
    } catch { toast.error("تعذر حفظ التقييم"); }
  };

  return (
    <div className="rounded-2xl p-6 text-center shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <h2 className="font-bold mb-1" style={{ color: "#1F1535" }}>قيّم الخدمة</h2>
      <p className="text-sm text-purple-400 mb-4">
        {saved ? "شكراً على تقييمك! 🌟" : "كيف كانت تجربتك مع فريق الدعم؟"}
      </p>
      <div className="flex items-center justify-center gap-2">
        {[1,2,3,4,5].map(val => (
          <button key={val} onClick={() => save(val)}
            onMouseEnter={() => !saved && setHover(val)}
            onMouseLeave={() => setHover(0)}
            disabled={saved}
            className="transition-transform hover:scale-110 disabled:cursor-default">
            <Star className="w-9 h-9 transition-colors"
              style={{
                fill:   val <= (hover || rating) ? "#7C3AED" : "transparent",
                color:  val <= (hover || rating) ? "#7C3AED" : "#d1d5db",
              }} />
          </button>
        ))}
      </div>
    </div>
  );
}
