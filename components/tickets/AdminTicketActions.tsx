"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { statusLabel, priorityLabel } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ALL_STATUSES   = ["OPEN","IN_PROGRESS","PENDING_APPROVAL","APPROVED","WAITING_INFO","RESOLVED","CLOSED"];
const ALL_PRIORITIES = ["LOW","MEDIUM","HIGH","CRITICAL"];

interface Props {
  ticket: { id: string; status: string; priority: string; assignedToId: string | null; requiresApproval: boolean };
  supportUsers: { id: string; name: string }[];
  currentUserId: string;
}

type ConfirmAction = { type: "approve" | "reject" | "save"; label: string; danger: boolean };

export default function AdminTicketActions({ ticket, supportUsers }: Props) {
  const router = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState(ticket.status);
  const [priority,  setPriority]  = useState(ticket.priority);
  const [assignTo,  setAssignTo]  = useState(ticket.assignedToId || "");
  const [confirm,   setConfirm]   = useState<ConfirmAction | null>(null);

  const update = async (data: object) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ التغييرات بنجاح");
      router.refresh();
    } catch {
      toast.error("فشل حفظ التغييرات، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "approve") update({ status: "APPROVED" });
    else if (confirm.type === "reject") update({ status: "CLOSED" });
    else update({ status, priority, assignedToId: assignTo || null });
    setConfirm(null);
  };

  const confirmMessages: Record<string, string> = {
    approve: "هل تريد اعتماد هذه التذكرة والموافقة عليها؟",
    reject:  "هل تريد رفض هذه التذكرة؟ سيتم إغلاقها نهائياً.",
    save:    `هل تريد حفظ التغييرات؟ سيتم تغيير الحالة إلى "${statusLabel[status]}"`,
  };

  return (
    <>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === "approve" ? "تأكيد الاعتماد" : confirm?.type === "reject" ? "تأكيد الرفض" : "تأكيد حفظ التغييرات"}
        message={confirm ? confirmMessages[confirm.type] : ""}
        confirmLabel={confirm?.label || "تأكيد"}
        danger={confirm?.danger || false}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      <div <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#100835", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="font-bold text-white mb-4">إجراءات المدير</h2>

        {ticket.status === "PENDING_APPROVAL" && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: "#fefce8", borderColor: "#fde047" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "#92400e" }}>هذه التذكرة تنتظر اعتمادك</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm({ type: "approve", label: "اعتماد", danger: false })}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#7C3AED" }}>
                <CheckCircle2 className="w-4 h-4" />اعتماد
              </button>
              <button
                onClick={() => setConfirm({ type: "reject", label: "رفض", danger: true })}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                <XCircle className="w-4 h-4" />رفض
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "الحالة",    value: status,   onChange: setStatus,   options: ALL_STATUSES.map(s => ({ v: s, l: statusLabel[s] })) },
            { label: "الأولوية", value: priority, onChange: setPriority, options: ALL_PRIORITIES.map(p => ({ v: p, l: priorityLabel[p] })) },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">{f.label}</label>
              <select value={f.value} onChange={(e) => f.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#7C3AED" } as any}>
                {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1.5">إسناد إلى</label>
            <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
              className="w-full px-3 py-2 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#7C3AED" } as any}>
              <option value="">غير مسندة</option>
              {supportUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => setConfirm({ type: "save", label: "حفظ", danger: false })}
          disabled={loading}
          className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
          {loading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </>
  );
}
