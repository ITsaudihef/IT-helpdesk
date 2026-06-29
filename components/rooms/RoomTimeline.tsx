"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CalendarDays, Plus, X, Clock, Users, MapPin, CheckCircle } from "lucide-react";

interface Room {
  id: string;
  name: string;
  capacity: number;
  features: string;
  location: string | null;
}

interface Booking {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  user: { id: string; name: string };
}

interface Props {
  rooms: Room[];
  bookings: Booking[];
  date: string;
  currentUserId: string;
}

const HOUR_START = 7;
const HOUR_END   = 20;
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60;

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minsToPercent(mins: number) {
  return Math.max(0, Math.min(100, ((mins - HOUR_START * 60) / TOTAL_MINS) * 100));
}

const HOUR_LABELS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
  const h = HOUR_START + i;
  return h < 12 ? `${h}ص` : h === 12 ? "12م" : `${h - 12}م`;
});

export default function RoomTimeline({ rooms, bookings, date, currentUserId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({
    roomId:    rooms[0]?.id || "",
    title:     "",
    date,
    startTime: "09:00",
    endTime:   "10:00",
    notes:     "",
  });
  const [conflictMsg, setConflictMsg] = useState("");

  const openModal = (roomId?: string, startTime?: string) => {
    setConflictMsg("");
    setForm(f => ({
      ...f,
      roomId:    roomId || rooms[0]?.id || "",
      startTime: startTime || "09:00",
      endTime:   startTime ? addHour(startTime) : "10:00",
      date,
    }));
    setShowModal(true);
  };

  const addHour = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const nh = Math.min(h + 1, HOUR_END - 1);
    return `${String(nh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startTime >= form.endTime) {
      setConflictMsg("وقت الانتهاء يجب أن يكون بعد وقت البداية");
      return;
    }
    setSaving(true);
    setConflictMsg("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setConflictMsg(data.error || "حدث خطأ");
        return;
      }
      toast.success("تم الحجز بنجاح");
      setShowModal(false);
      startTransition(() => router.refresh());
    } catch {
      setConflictMsg("حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (id: string) => {
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

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    router.push(`/rooms?date=${d.toISOString().split("T")[0]}`);
  };

  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#F5F3FF", border: "1px solid #D1C4FE", color: "#7C3AED" }}>
            ‹ السابق
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg"
            style={{ background: isToday ? "rgba(124,58,237,0.1)" : "#F5F3FF", border: "1px solid #D1C4FE" }}>
            <CalendarDays className="w-4 h-4" style={{ color: "#7C3AED" }} />
            <input
              type="date"
              value={date}
              onChange={e => router.push(`/rooms?date=${e.target.value}`)}
              className="bg-transparent text-sm font-semibold focus:outline-none"
              style={{ color: "#1F1535" }}
            />
            {isToday && <span className="text-xs font-semibold" style={{ color: "#7C3AED" }}>اليوم</span>}
          </div>
          <button onClick={() => changeDate(1)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#F5F3FF", border: "1px solid #D1C4FE", color: "#7C3AED" }}>
            التالي ›
          </button>
        </div>
        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          <Plus className="w-4 h-4" />
          حجز جديد
        </button>
      </div>

      {/* ─── Legend ─── */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { color: "#7C3AED", bg: "rgba(124,58,237,0.12)", label: "حجزك" },
          { color: "#DC2626", bg: "rgba(220,38,38,0.1)",   label: "محجوزة" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: l.bg, border: `1.5px solid ${l.color}` }} />
            <span className="text-xs" style={{ color: "#6B6B8A" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ─── Timeline ─── */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        {/* Hour labels */}
        <div className="flex" style={{ paddingRight: "130px", borderBottom: "1px solid #F3F0FF" }}>
          <div className="flex-1 relative" style={{ height: "24px" }}>
            {HOUR_LABELS.map((label, i) => (
              <span key={i}
                className="absolute text-xs"
                style={{
                  left: `${(i / (HOUR_LABELS.length - 1)) * 100}%`,
                  transform: "translateX(-50%)",
                  top: "4px",
                  color: "#9CA3AF",
                  whiteSpace: "nowrap",
                }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Room rows */}
        {rooms.map((room, ri) => {
          const roomBookings = bookings.filter(b => b.roomId === room.id);
          return (
            <div key={room.id}
              className="flex items-center"
              style={{ borderBottom: ri < rooms.length - 1 ? "1px solid #F3F0FF" : "none", minHeight: "52px" }}>
              {/* Room label */}
              <div className="flex-shrink-0 px-4 py-3" style={{ width: "130px" }}>
                <p className="text-xs font-semibold truncate" style={{ color: "#1F1535" }}>{room.name}</p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#9CA3AF" }}>
                  <Users className="w-2.5 h-2.5" />{room.capacity}
                </p>
              </div>

              {/* Track */}
              <div className="flex-1 relative mx-3 my-2 rounded-lg cursor-pointer"
                style={{ height: "36px", background: "#F9F7FF" }}
                onClick={() => {
                  const slot = `${String(HOUR_START + 1).padStart(2, "0")}:00`;
                  openModal(room.id, slot);
                }}>

                {roomBookings.map(b => {
                  const startPct = minsToPercent(timeToMins(b.startTime));
                  const endPct   = minsToPercent(timeToMins(b.endTime));
                  const isMe     = b.user.id === currentUserId;
                  return (
                    <div key={b.id}
                      className="absolute top-1 rounded-md flex items-center px-2 overflow-hidden group"
                      style={{
                        left:   `${startPct}%`,
                        width:  `${endPct - startPct}%`,
                        height: "28px",
                        background: isMe ? "rgba(124,58,237,0.15)" : "rgba(220,38,38,0.1)",
                        border:     `1px solid ${isMe ? "#7C3AED" : "#DC2626"}`,
                      }}
                      title={`${b.title} (${b.startTime}–${b.endTime})`}>
                      <span className="text-xs font-semibold truncate flex-1"
                        style={{ color: isMe ? "#5B21B6" : "#991B1B" }}>
                        {b.title}
                      </span>
                      {isMe && (
                        <button
                          onClick={ev => { ev.stopPropagation(); cancelBooking(b.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title="إلغاء الحجز">
                          <X className="w-3 h-3" style={{ color: "#7C3AED" }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick book */}
              <button
                onClick={() => openModal(room.id)}
                className="flex-shrink-0 mr-2 ml-3 text-xs px-2 py-1 rounded-lg font-semibold transition-all opacity-60 hover:opacity-100"
                style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "1px solid #D1C4FE" }}>
                + حجز
              </button>
            </div>
          );
        })}

        {rooms.length === 0 && (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1C4FE" }} />
            <p style={{ color: "#6B6B8A" }}>لا توجد قاعات متاحة</p>
          </div>
        )}
      </div>

      {/* ─── Booking Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="rounded-2xl w-full max-w-md shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F0FF" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.1)" }}>
                  <CalendarDays className="w-5 h-5" style={{ color: "#7C3AED" }} />
                </div>
                <h2 className="font-bold" style={{ color: "#1F1535" }}>حجز قاعة</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-purple-50">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
            </div>

            <form onSubmit={handleBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>القاعة</label>
                <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.capacity} أشخاص)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>عنوان الاجتماع</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="مثال: اجتماع فريق التطوير"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>التاريخ</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>من</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>إلى</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>ملاحظات (اختياري)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="تجهيزات مطلوبة، عدد الحضور..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
              </div>

              {conflictMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(220,38,38,0.07)", border: "1px solid #FCA5A5", color: "#DC2626" }}>
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {conflictMsg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {saving ? "جارٍ الحجز..." : <><CheckCircle className="w-4 h-4" />تأكيد الحجز</>}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid #E9E3FF", color: "#6D28D9" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Room info cards ─── */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map(room => {
          const roomBookings = bookings.filter(b => b.roomId === room.id);
          const features = room.features ? room.features.split(",") : [];
          return (
            <div key={room.id} className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: "#1F1535" }}>{room.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: roomBookings.length === 0 ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.08)",
                    color:      roomBookings.length === 0 ? "#15803D" : "#DC2626",
                  }}>
                  {roomBookings.length === 0 ? "متاحة" : `${roomBookings.length} حجز`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs mb-2" style={{ color: "#6B6B8A" }}>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.capacity}</span>
                {room.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{room.location}</span>}
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {features.slice(0, 3).map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #E9E3FF" }}>
                      {f.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
