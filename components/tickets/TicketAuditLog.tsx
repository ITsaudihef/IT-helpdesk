"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
  actor: { name: string; role: string } | null;
}

const ACTION_ICON: Record<string, { icon: string; color: string }> = {
  "إنشاء التذكرة":  { icon: "🟢", color: "#00805b" },
  "تغيير الحالة":   { icon: "🔄", color: "#d97706" },
  "تغيير التكليف":  { icon: "👤", color: "#7c3aed" },
  "تغيير الأولوية": { icon: "⚡", color: "#dc2626" },
  "تقييم التذكرة":  { icon: "⭐", color: "#f59e0b" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export default function TicketAuditLog({ ticketId }: { ticketId: string }) {
  const [open,    setOpen]    = useState(false);
  const [logs,    setLogs]    = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || logs.length) return;
    setLoading(true);
    fetch(`/api/tickets/${ticketId}/audit`)
      .then(r => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [open, ticketId, logs.length]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-right transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-800 text-sm">سجل الأحداث</span>
          {logs.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
              {logs.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Collapsed body */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد أحداث مسجّلة</p>
          ) : (
            <ol className="relative border-r-2 border-gray-100 space-y-5 pr-4">
              {logs.map((log) => {
                const meta = ACTION_ICON[log.action] || { icon: "📌", color: "#6b7280" };
                return (
                  <li key={log.id} className="relative">
                    {/* Dot on the timeline */}
                    <span
                      className="absolute -right-[1.2rem] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px]"
                      style={{ background: meta.color }}
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{log.action}</span>
                        {log.actor && (
                          <span className="text-xs text-gray-400">— {log.actor.name}</span>
                        )}
                      </div>
                      {log.detail && (
                        <p className="text-xs text-gray-600">{log.detail}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatTime(log.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
