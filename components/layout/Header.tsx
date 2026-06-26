"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string; message: string; read: boolean; createdAt: string;
  ticket?: { ticketNo: string };
}

export default function Header({ title }: { title: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setNotifications).catch(() => {});
  }, []);

  const markRead = async () => {
    setOpen(!open);
    if (unread > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <header className="h-16 flex items-center justify-between pr-16 lg:pr-6 pl-6 sticky top-0 z-20"
      style={{ background: "#0d0728", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
      <h2 className="font-bold text-white">{title}</h2>

      <div className="relative">
        <button onClick={markRead} className="relative p-2 rounded-xl transition-all"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <Bell className="w-5 h-5 text-purple-300" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-white text-xs rounded-full flex items-center justify-center font-bold"
              style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-12 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div className="p-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }} />
              <p className="text-sm font-semibold text-white">الإشعارات</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm p-4 text-center" style={{ color: "#A78BFA" }}>لا توجد إشعارات</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 text-sm transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: !n.read ? "rgba(124,58,237,0.08)" : "transparent" }}>
                    <p className="text-white">{n.message}</p>
                    {n.ticket && <p className="text-xs mt-1" style={{ color: "#A78BFA" }}>{n.ticket.ticketNo}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
