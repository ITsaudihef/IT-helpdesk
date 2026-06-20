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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between pr-16 lg:pr-6 pl-6 sticky top-0 z-20 shadow-sm">
      <h2 className="font-bold text-gray-900">{title}</h2>

      <div className="relative">
        <button onClick={markRead} className="relative p-2 rounded-lg hover:bg-green-50 transition-colors">
          <Bell className="w-5 h-5" style={{ color: "#6fb54a" }} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-white text-xs rounded-full flex items-center justify-center font-bold" style={{ background: "#00805b" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#6fb54a" }} />
              <p className="text-sm font-semibold text-gray-900">الإشعارات</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">لا توجد إشعارات</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={cn("px-4 py-3 border-b border-gray-50 text-sm", !n.read && "bg-green-50")}>
                    <p className="text-gray-800">{n.message}</p>
                    {n.ticket && <p className="text-xs text-gray-400 mt-1">{n.ticket.ticketNo}</p>}
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
