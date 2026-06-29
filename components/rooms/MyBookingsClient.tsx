"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CalendarDays, MapPin, Clock, X, CheckCircle } from "lucide-react";

interface Booking {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  room: { name: string; location: string | null };
}

interface Props { upcoming: Booking[]; past: Booking[] }

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatArabicDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}

function BookingCard({ b, canCancel, onCancel }: { b: Booking; canCancel: boolean; onCancel: (id: string) => void }) {
  const d = new Date(b.date);
  const dayName = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][d.getDay()];
  return (
    <div className="rounded-xl p-4 flex items-start gap-4" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
        style={{ background: canCancel ? "rgba(124,58,237,0.08)" : "#F5F3FF", border: "1px solid #E9E3FF" }}>
        <span className="text-xs font-medium" style={{ color: "#7C3AED" }}>{MONTHS_AR[d.getMonth()].slice(0,3)}</span>
        <span className="text-lg font-bold leading-none" style={{ color: "#1F1535" }}>{d.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate mb-1" style={{ color: "#1F1535" }}>{b.title}</p>
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#6B6B8A" }}>
          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{dayName} {formatArabicDate(b.date)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.startTime} – {b.endTime}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.room.name}{b.room.location ? ` · ${b.room.location}` : ""}</span>
        </div>
        {b.notes && <p className="text-xs mt-1.5 italic" style={{ color: "#9CA3AF" }}>{b.notes}</p>}
      </div>
      {canCancel && (
        <button onClick={() => onCancel(b.id)}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          title="إلغاء الحجز">
          <X className="w-4 h-4 text-red-400" />
        </button>
      )}
    </div>
  );
}

export default function MyBookingsClient({ upcoming, past }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const handleCancel = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "حدث خطأ");
        return;
      }
      toast.success("تم إلغاء الحجز");
      startTransition(() => router.refresh());
    } catch {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <p className="text-2xl font-bold" style={{ color: "#7C3AED" }}>{upcoming.length}</p>
          <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>حجوزات قادمة</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <p className="text-2xl font-bold" style={{ color: "#6B7280" }}>{past.length}</p>
          <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>حجوزات سابقة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { key: "upcoming", label: `القادمة (${upcoming.length})` },
          { key: "past",     label: `السابقة (${past.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t.key
              ? { background: "#7C3AED", color: "#fff" }
              : { background: "#F5F3FF", color: "#7C3AED" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {tab === "upcoming" && (
          upcoming.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
              <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1C4FE" }} />
              <p className="font-medium" style={{ color: "#1F1535" }}>لا توجد حجوزات قادمة</p>
              <p className="text-sm mt-1" style={{ color: "#7C6A9E" }}>احجز قاعة من صفحة الحجز</p>
            </div>
          ) : (
            upcoming.map(b => <BookingCard key={b.id} b={b} canCancel onCancel={handleCancel} />)
          )
        )}
        {tab === "past" && (
          past.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1C4FE" }} />
              <p className="font-medium" style={{ color: "#1F1535" }}>لا توجد حجوزات سابقة</p>
            </div>
          ) : (
            past.map(b => <BookingCard key={b.id} b={b} canCancel={false} onCancel={handleCancel} />)
          )
        )}
      </div>
    </div>
  );
}
