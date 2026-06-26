"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { statusLabel } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const statusTransitions: Record<string, string[]> = {
  OPEN:             ["IN_PROGRESS", "WAITING_INFO", "CLOSED"],
  IN_PROGRESS:      ["RESOLVED", "WAITING_INFO", "CLOSED"],
  WAITING_INFO:     ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  APPROVED:         ["IN_PROGRESS"],
  RESOLVED:         ["CLOSED"],
  CLOSED:           [],
  PENDING_APPROVAL: [],
};

interface Props {
  ticket: { id: string; status: string; assignedToId: string | null };
  supportUsers: { id: string; name: string }[];
  currentUserId: string;
}

export default function SupportTicketActions({ ticket, supportUsers, currentUserId }: Props) {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [assignTo, setAssignTo] = useState(ticket.assignedToId || "");
  const [confirm,  setConfirm]  = useState<{ status: string } | null>(null);
  const transitions = statusTransitions[ticket.status] || [];

  const updateTicket = async (data: object) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("تم تحديث حالة التذكرة بنجاح");
      router.refresh();
    } catch {
      toast.error("فشل تحديث التذكرة، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (s: string) => setConfirm({ status: s });

  const handleConfirm = () => {
    if (!confirm) return;
    updateTicket({ status: confirm.status });
    setConfirm(null);
  };

  return (
    <>
      <ConfirmDialog
        open={!!confirm}
        title="تأكيد تغيير الحالة"
        message={`هل أنت متأكد من تغيير حالة التذكرة إلى "${confirm ? statusLabel[confirm.status] : ""}"؟`}
        confirmLabel="نعم، تأكيد"
        danger={confirm?.status === "CLOSED"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      <div className="rounded-2xl" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }} className_unused=" p-6 shadow-sm">
        <h2 className="font-bold text-white mb-4">الإجراءات</h2>
        <div className="space-y-4">
          {transitions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-purple-200 mb-2">تغيير الحالة</p>
              <div className="flex flex-wrap gap-2">
                {transitions.map((s) => (
                  <button key={s} onClick={() => handleStatusClick(s)} disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border disabled:opacity-50 transition-colors"
                    style={{ borderColor: "#7C3AED", color: "#5B21B6", background: "rgba(124,58,237,0.12)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#7C3AED"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.12)"; (e.currentTarget as HTMLElement).style.color = "#5B21B6"; }}>
                    → {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-purple-200 mb-2">إسناد إلى موظف</p>
            <div className="flex gap-2">
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#7C3AED" } as any}>
                <option value="">غير مسندة</option>
                {supportUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}{u.id === currentUserId ? " (أنا)" : ""}</option>
                ))}
              </select>
              <button onClick={() => updateTicket({ assignedToId: assignTo || null })} disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#7C3AED" }}>
                حفظ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
