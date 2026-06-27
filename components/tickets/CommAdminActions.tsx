"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface CommSupportUser { id: string; name: string; }
interface Props {
  ticketId: string;
  status: string;
  commSupportUsers: CommSupportUser[];
}

export default function CommAdminActions({ ticketId, status, commSupportUsers }: Props) {
  const router = useRouter();
  const [assignedToId, setAssignedToId] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const isPending = status === "PENDING_APPROVAL";

  const approve = async () => {
    if (!assignedToId) { toast.error("اختر موظف دعم الاتصال المؤسسي أولاً"); return; }
    setLoading("approve");
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS", assignedToId }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم اعتماد التذكرة وتكليفها");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  const reject = async () => {
    setLoading("reject");
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم رفض التذكرة");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  if (!isPending) return null;

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#100835", border: "1px solid rgba(245,158,11,0.25)" }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <h3 className="font-bold text-white text-sm">اعتماد التذكرة</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-200 mb-1.5">تكليف إلى موظف دعم الاتصال المؤسسي</label>
        <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)}
          className="w-full px-3 py-2.5 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white">
          <option value="">— اختر موظفاً —</option>
          {commSupportUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button onClick={approve} disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
          <CheckCircle className="w-4 h-4" />
          {loading === "approve" ? "جارٍ الاعتماد..." : "اعتماد وتكليف"}
        </button>
        <button onClick={reject} disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 bg-red-500 hover:bg-red-600 transition-all">
          <XCircle className="w-4 h-4" />
          {loading === "reject" ? "جارٍ الرفض..." : "رفض"}
        </button>
      </div>
    </div>
  );
}
