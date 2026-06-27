"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  open:      boolean;
  title:     string;
  message:   string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:   boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = "تأكيد", cancelLabel = "إلغاء",
  danger = false, onConfirm, onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: danger ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: danger ? "#FCA5A5" : "#FCD34D" }} />
          </div>
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-purple-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: danger ? "#dc2626" : "#7C3AED" }}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="flex-1 border border-white/8 text-purple-200 py-2 rounded-lg text-sm hover:bg-white/5">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
