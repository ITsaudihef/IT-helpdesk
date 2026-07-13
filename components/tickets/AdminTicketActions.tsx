"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { statusLabel, priorityLabel } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Options shown in the status dropdown, keyed by the ticket's CURRENT status —
// each list includes the current status itself (so "no change" stays valid)
// plus only the statuses that make sense to jump to from there. READY_TO_LAUNCH
// is deliberately never offered as a target — it's only reachable automatically
// once the requester passes their test (see /api/tickets/[id]/user-test).
const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN:                  ["OPEN", "IN_PROGRESS", "WAITING_INFO", "CLOSED"],
  IN_PROGRESS:           ["IN_PROGRESS", "PENDING_USER_TEST", "WAITING_INFO", "RESOLVED", "CLOSED"],
  WAITING_INFO:          ["WAITING_INFO", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  PENDING_DEPT_APPROVAL: ["PENDING_DEPT_APPROVAL", "PENDING_APPROVAL", "OPEN"],
  PENDING_APPROVAL:      ["PENDING_APPROVAL", "APPROVED", "CLOSED"],
  APPROVED:              ["APPROVED", "IN_PROGRESS"],
  PENDING_USER_TEST:     ["PENDING_USER_TEST", "IN_PROGRESS"],
  READY_TO_LAUNCH:       ["READY_TO_LAUNCH", "LAUNCHED"],
  LAUNCHED:              ["LAUNCHED", "CLOSED"],
  RESOLVED:              ["RESOLVED", "IN_PROGRESS", "CLOSED"],
  CLOSED:                ["CLOSED", "OPEN"],
};
const ALL_PRIORITIES = ["LOW","MEDIUM","HIGH","CRITICAL"];

interface Props {
  ticket: { id: string; status: string; priority: string; assignedToId: string | null; requiresApproval: boolean };
  supportUsers: { id: string; name: string }[];
  currentUserId: string;
}

type ConfirmAction = { type: "approve" | "reject" | "save" | "launch"; label: string; danger: boolean };

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
    else if (confirm.type === "launch") update({ status: "LAUNCHED" });
    else update({ status, priority, assignedToId: assignTo || null });
    setConfirm(null);
  };

  const confirmMessages: Record<string, string> = {
    approve: "هل تريد اعتماد هذه التذكرة والموافقة عليها؟",
    reject:  "هل تريد رفض هذه التذكرة؟ سيتم إغلاقها نهائياً.",
    save:    `هل تريد حفظ التغييرات؟ سيتم تغيير الحالة إلى "${statusLabel[status]}"`,
    launch:  "هل تم إطلاق هذا التحديث فعلياً؟ سيتم تعليم التذكرة كمُطلقة.",
  };

  const confirmTitles: Record<string, string> = {
    approve: "تأكيد الاعتماد",
    reject:  "تأكيد الرفض",
    launch:  "تأكيد الإطلاق",
    save:    "تأكيد حفظ التغييرات",
  };

  return (
    <>
      <ConfirmDialog
        open={!!confirm}
        title={confirm ? confirmTitles[confirm.type] : ""}
        message={confirm ? confirmMessages[confirm.type] : ""}
        confirmLabel={confirm?.label || "تأكيد"}
        danger={confirm?.danger || false}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <h2 className="font-bold mb-4" style={{ color: "#1F1535" }}>إجراءات المدير</h2>

        {ticket.status === "PENDING_APPROVAL" && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "#92400E" }}>هذه التذكرة تنتظر اعتمادك</p>
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

        {ticket.status === "READY_TO_LAUNCH" && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: "rgba(6,182,212,0.08)", borderColor: "rgba(6,182,212,0.25)" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "#0E7490" }}>الطالب اختبر التذكرة ونجحت — جاهزة للإطلاق</p>
            <button
              onClick={() => setConfirm({ type: "launch", label: "إطلاق", danger: false })}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#0891B2" }}>
              <CheckCircle2 className="w-4 h-4" />إطلاق التذكرة
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "الحالة",    value: status,   onChange: setStatus,   options: (STATUS_TRANSITIONS[ticket.status] || [ticket.status]).map(s => ({ v: s, l: statusLabel[s] })) },
            { label: "الأولوية", value: priority, onChange: setPriority, options: ALL_PRIORITIES.map(p => ({ v: p, l: priorityLabel[p] })) },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <select value={f.value} onChange={(e) => f.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#7C3AED" } as any}>
                {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">إسناد إلى</label>
            <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
              className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2"
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
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          {loading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </>
  );
}
