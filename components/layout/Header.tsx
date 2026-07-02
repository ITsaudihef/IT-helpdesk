"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: string; message: string; read: boolean; createdAt: string;
  ticket?: { ticketNo: string };
}

export default function Header({ title }: { title: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]     = useState(false);
  const [live, setLive]     = useState(false);
  const [loadError, setLoadError] = useState(false);
  const retryRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef               = useRef<EventSource | null>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Initial load
    fetch("/api/notifications")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(setNotifications)
      .catch((err) => {
        console.error("[notifications] initial load failed:", err);
        setLoadError(true);
      });

    // SSE real-time stream with auto-reconnect
    function connect() {
      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      es.onopen = () => setLive(true);

      es.onmessage = (e) => {
        try {
          const notif: Notification = JSON.parse(e.data);
          if (!notif?.id) return; // heartbeat
          setNotifications((prev) => {
            if (prev.find((n) => n.id === notif.id)) return prev;
            return [notif, ...prev];
          });
        } catch {}
      };

      es.onerror = () => {
        setLive(false);
        es.close();
        // Retry after 6 seconds
        retryRef.current = setTimeout(connect, 6_000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const markRead = async () => {
    setOpen((v) => !v);
    if (unread > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <header className="h-16 flex items-center justify-between pr-16 lg:pr-6 pl-6 sticky top-0 z-20"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E9E3FF", backdropFilter: "blur(12px)" }}>
      <h2 className="font-bold" style={{ color: "#1F1535" }}>{title}</h2>

      <div className="relative flex items-center gap-2">
        {/* Live indicator dot */}
        <span
          title={live ? "متصل — إشعارات فورية" : "في وضع الاستعداد"}
          className="w-2 h-2 rounded-full transition-colors"
          style={{ background: live ? "#22c55e" : "#d1d5db" }}
        />

        <button onClick={markRead} className="relative p-2 rounded-xl transition-all"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid #E9E3FF" }}>
          <Bell className="w-5 h-5" style={{ color: "#7C3AED" }} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-white text-xs rounded-full flex items-center justify-center font-bold"
              style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-12 w-80 rounded-xl shadow-lg z-50 overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid #E9E3FF", boxShadow: "0 8px 30px rgba(124,58,237,0.12)" }}>
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F3EEFF" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }} />
                <p className="text-sm font-semibold" style={{ color: "#1F1535" }}>الإشعارات</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: live ? "rgba(34,197,94,0.1)" : "rgba(209,213,219,0.3)", color: live ? "#16a34a" : "#6b7280" }}>
                {live ? "مباشر" : "..."}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {loadError ? (
                <p className="text-sm p-4 text-center" style={{ color: "#DC2626" }}>تعذر تحميل الإشعارات — تحقق من اتصالك</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm p-4 text-center" style={{ color: "#7C6A9E" }}>لا توجد إشعارات</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 text-sm transition-colors"
                    style={{ borderBottom: "1px solid #F3EEFF", background: !n.read ? "rgba(124,58,237,0.05)" : "transparent" }}>
                    <p style={{ color: "#1F1535" }}>{n.message}</p>
                    {n.ticket && <p className="text-xs mt-1" style={{ color: "#7C3AED" }}>{n.ticket.ticketNo}</p>}
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
