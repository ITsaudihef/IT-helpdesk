"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CalendarDays, Plus, X, Clock, Users, MapPin,
  CheckCircle, Lock, ChevronLeft, ChevronRight,
} from "lucide-react";

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

const HOUR_START  = 7;
const HOUR_END    = 20;
const TOTAL_MINS  = (HOUR_END - HOUR_START) * 60;
const HOURS       = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function pct(mins: number) {
  return Math.max(0, Math.min(100, ((mins - HOUR_START * 60) / TOTAL_MINS) * 100));
}
function fmtHour(h: number) {
  if (h === 12) return "12م";
  return h > 12 ? `${h - 12}م` : `${h}ص`;
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("ar-SA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function addHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(h + 1, HOUR_END - 1)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const LABEL_COL = 148; // px — room name column width on desktop

export default function RoomTimeline({ rooms, bookings, date, currentUserId }: Props) {
  const router = useRouter();
  const [, startTx] = useTransition();

  const [showModal,       setShowModal]       = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [conflictMsg,     setConflictMsg]     = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState({
    roomId:    rooms[0]?.id || "",
    title:     "",
    date,
    startTime: "09:00",
    endTime:   "10:00",
    notes:     "",
  });

  const openModal = (roomId?: string, startTime?: string) => {
    setConflictMsg("");
    setForm(f => ({
      ...f,
      roomId:    roomId    || rooms[0]?.id || "",
      startTime: startTime || "09:00",
      endTime:   startTime ? addHour(startTime) : "10:00",
      date,
    }));
    setShowModal(true);
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
      const res  = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setConflictMsg(data.error || "حدث خطأ"); return; }
      toast.success("تم الحجز بنجاح");
      setShowModal(false);
      startTx(() => router.refresh());
    } catch {
      setConflictMsg("حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;
    setSelectedBooking(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "حدث خطأ"); return; }
      toast.success("تم إلغاء الحجز");
      startTx(() => router.refresh());
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

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div dir="rtl">

      {/* ── Date navigation ── */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={() => changeDate(-1)}
            className="p-2 rounded-xl flex-shrink-0 transition-all hover:shadow-sm"
            style={{ background: "#F5F3FF", border: "1px solid #D1C4FE", color: "#7C3AED" }}>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              {isToday && (
                <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "#7C3AED", color: "#fff" }}>اليوم</span>
              )}
              <input
                type="date" value={date}
                onChange={e => router.push(`/rooms?date=${e.target.value}`)}
                className="bg-transparent text-sm font-bold focus:outline-none text-center cursor-pointer"
                style={{ color: "#1F1535" }}
              />
            </div>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: "#7C6A9E" }}>{fmtDate(date)}</p>
          </div>

          <button onClick={() => changeDate(1)}
            className="p-2 rounded-xl flex-shrink-0 transition-all hover:shadow-sm"
            style={{ background: "#F5F3FF", border: "1px solid #D1C4FE", color: "#7C3AED" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          <Plus className="w-4 h-4" /><span>حجز جديد</span>
        </button>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        {[
          { color: "#7C3AED", bg: "rgba(124,58,237,0.15)", label: "حجزي" },
          { color: "#64748B", bg: "rgba(100,116,139,0.12)", label: "محجوز" },
          { color: "#16A34A", bg: "rgba(22,163,74,0.1)",   label: "متاحة" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: l.bg, border: `1.5px solid ${l.color}` }} />
            <span className="text-xs" style={{ color: "#6B6B8A" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP  — Gantt timeline  (md and above)
      ════════════════════════════════════════════════ */}
      <div className="hidden md:block rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "#fff", border: "1px solid #E9E3FF" }}>

        {/* Hour header */}
        <div className="flex items-center" style={{ borderBottom: "2px solid #E9E3FF", height: "32px" }}>
          {/* spacer for room label column */}
          <div className="flex-shrink-0" style={{ width: LABEL_COL, borderLeft: "1px solid #E9E3FF" }} />
          {/* hour labels – relative container, labels at % positions */}
          <div className="flex-1 relative">
            {HOURS.map((h, i) => (
              <span key={h}
                className="absolute text-xs select-none"
                style={{
                  left:      `${(i / (HOURS.length - 1)) * 100}%`,
                  transform: i === 0 ? "none" : i === HOURS.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                  top:       "7px",
                  color:     "#B0A8C8",
                  whiteSpace: "nowrap",
                }}>
                {fmtHour(h)}
              </span>
            ))}
          </div>
        </div>

        {rooms.length === 0 ? (
          <EmptyRooms />
        ) : rooms.map((room, ri) => {
          const rb    = bookings.filter(b => b.roomId === room.id);
          const isFree = rb.length === 0;
          return (
            <div key={room.id} className="flex items-stretch group/row"
              style={{ borderBottom: ri < rooms.length - 1 ? "1px solid #F3F0FF" : "none", minHeight: "60px" }}>

              {/* Room label */}
              <div className="flex-shrink-0 flex flex-col justify-center px-4 py-2"
                style={{ width: LABEL_COL, background: "#FAFBFF", borderLeft: "1px solid #EEEBFF" }}>
                <p className="text-xs font-bold truncate" style={{ color: "#1F1535" }}>{room.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs flex items-center gap-0.5" style={{ color: "#A0A0BA" }}>
                    <Users className="w-2.5 h-2.5" />{room.capacity}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: isFree ? "rgba(22,163,74,0.1)" : "rgba(100,116,139,0.1)",
                      color:      isFree ? "#16A34A"              : "#64748B",
                    }}>
                    {isFree ? "متاحة" : `${rb.length} حجز`}
                  </span>
                </div>
              </div>

              {/* Timeline track */}
              <div className="flex-1 relative cursor-pointer"
                style={{ background: "#FAFBFF" }}
                onClick={() => openModal(room.id)}>

                {/* Hour grid lines */}
                {HOURS.slice(1, -1).map((h, i) => (
                  <div key={h} className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left:        `${((i + 1) / (HOURS.length - 1)) * 100}%`,
                      borderRight: "1px dashed #EEEBFF",
                    }} />
                ))}

                {/* Hover tint */}
                <div className="absolute inset-0 opacity-0 group-hover/row:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: "rgba(124,58,237,0.025)" }} />

                {/* Booking blocks */}
                {rb.map(b => {
                  const s    = pct(timeToMins(b.startTime));
                  const e    = pct(timeToMins(b.endTime));
                  const w    = Math.max(e - s, 1.5);
                  const isMe = b.userId === currentUserId;
                  return (
                    <div key={b.id}
                      onClick={ev => { ev.stopPropagation(); if (isMe) setSelectedBooking(b); }}
                      className="absolute rounded-lg overflow-hidden transition-all"
                      style={{
                        left:       `${s}%`,
                        width:      `${w}%`,
                        top:        "8px",
                        height:     "44px",
                        background: isMe ? "rgba(124,58,237,0.14)" : "rgba(100,116,139,0.1)",
                        border:     `1.5px solid ${isMe ? "#8B5CF6" : "#94A3B8"}`,
                        cursor:     isMe ? "pointer" : "default",
                        zIndex:     1,
                      }}
                      title={`${isMe ? b.title : "محجوز"} — ${b.startTime}–${b.endTime}`}>
                      <div className="flex flex-col justify-center h-full px-2 overflow-hidden">
                        {w > 6 && (
                          <span className="text-xs font-bold truncate leading-tight"
                            style={{ color: isMe ? "#5B21B6" : "#475569" }}>
                            {isMe ? b.title : (
                              <span className="flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />محجوز
                              </span>
                            )}
                          </span>
                        )}
                        {w > 9 && (
                          <span className="text-xs leading-tight"
                            style={{ color: isMe ? "#8B5CF6" : "#94A3B8" }}>
                            {b.startTime}–{b.endTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE  — Room cards  (below md)
      ════════════════════════════════════════════════ */}
      <div className="md:hidden space-y-3">
        {rooms.length === 0 ? <EmptyRooms /> : rooms.map(room => {
          const rb     = bookings.filter(b => b.roomId === room.id)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isFree = rb.length === 0;

          return (
            <div key={room.id} className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #E9E3FF" }}>

              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: "#FAFBFF", borderBottom: isFree ? "none" : "1px solid #F3F0FF" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.1)" }}>
                    <CalendarDays className="w-4 h-4" style={{ color: "#7C3AED" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#1F1535" }}>{room.name}</p>
                    <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "#A0A0BA" }}>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{room.capacity}</span>
                      {room.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{room.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{
                      background: isFree ? "rgba(22,163,74,0.1)" : "rgba(100,116,139,0.1)",
                      color:      isFree ? "#16A34A"              : "#64748B",
                    }}>
                    {isFree ? "متاحة" : `${rb.length} حجز`}
                  </span>
                  <button onClick={() => openModal(room.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                    <Plus className="w-3 h-3" />حجز
                  </button>
                </div>
              </div>

              {/* Booking list */}
              {!isFree && (
                <div className="px-3 py-3 space-y-2">
                  {rb.map(b => {
                    const isMe = b.userId === currentUserId;
                    return (
                      <div key={b.id}
                        onClick={() => isMe && setSelectedBooking(b)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                        style={{
                          background: isMe ? "rgba(124,58,237,0.07)" : "rgba(100,116,139,0.05)",
                          border:     `1px solid ${isMe ? "#C4B5FD" : "#E2E8F0"}`,
                          cursor:     isMe ? "pointer" : "default",
                        }}>
                        {/* color bar */}
                        <div className="w-1 h-9 rounded-full flex-shrink-0"
                          style={{ background: isMe ? "#7C3AED" : "#94A3B8" }} />
                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: isMe ? "#5B21B6" : "#64748B" }}>
                            {isMe ? b.title : "محجوز"}
                          </p>
                          <p className="text-xs mt-0.5 flex items-center gap-1"
                            style={{ color: isMe ? "#8B5CF6" : "#94A3B8" }}>
                            <Clock className="w-3 h-3" />{b.startTime} – {b.endTime}
                          </p>
                        </div>
                        {/* badge / lock */}
                        {isMe ? (
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                            style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>
                            حجزي
                          </span>
                        ) : (
                          <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CBD5E1" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════
          My booking detail / cancel sheet
      ════════════════════════════════════════════════ */}
      {selectedBooking && (() => {
        const b    = selectedBooking;
        const room = rooms.find(r => r.id === b.roomId);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            onClick={() => setSelectedBooking(null)}>
            <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-xl mx-0 sm:mx-4"
              style={{ background: "#fff", border: "1px solid #E9E3FF" }}
              onClick={e => e.stopPropagation()}>

              {/* handle bar (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "#E9E3FF" }} />
              </div>

              <div className="flex items-start justify-between px-5 pt-4 pb-3"
                style={{ borderBottom: "1px solid #F3F0FF" }}>
                <div className="min-w-0">
                  <p className="font-bold text-base truncate" style={{ color: "#1F1535" }}>{b.title}</p>
                  {room && <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>{room.name}</p>}
                </div>
                <button onClick={() => setSelectedBooking(null)}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-purple-50 mr-2">
                  <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                  <CalendarDays className="w-4 h-4 flex-shrink-0" style={{ color: "#7C3AED" }} />
                  {fmtDate(b.date)}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "#7C3AED" }} />
                  {b.startTime} – {b.endTime}
                </div>
                {b.notes && (
                  <p className="text-sm rounded-xl px-3 py-2"
                    style={{ background: "#F5F3FF", color: "#5B21B6" }}>{b.notes}</p>
                )}
                <button onClick={() => cancelBooking(b.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "rgba(220,38,38,0.07)", border: "1px solid #FCA5A5", color: "#DC2626" }}>
                  إلغاء الحجز
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════
          New booking modal
      ════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          dir="rtl" onClick={() => setShowModal(false)}>
          <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-xl"
            style={{ background: "#fff", border: "1px solid #E9E3FF" }}
            onClick={e => e.stopPropagation()}>

            {/* handle bar */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "#E9E3FF" }} />
            </div>

            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #F3F0FF" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.1)" }}>
                  <CalendarDays className="w-5 h-5" style={{ color: "#7C3AED" }} />
                </div>
                <h2 className="font-bold text-base" style={{ color: "#1F1535" }}>حجز قاعة</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-purple-50">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
            </div>

            <form onSubmit={handleBook} className="p-6 space-y-4">
              {/* Room select */}
              <Field label="القاعة">
                <select value={form.roomId}
                  onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} required
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.capacity} أشخاص)</option>
                  ))}
                </select>
              </Field>

              {/* Title */}
              <Field label="عنوان الاجتماع">
                <input type="text" value={form.title} required
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: اجتماع فريق التطوير"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
              </Field>

              {/* Date */}
              <Field label="التاريخ">
                <input type="date" value={form.date} required
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
              </Field>

              {/* Time row */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="من">
                  <input type="time" value={form.startTime} required
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
                </Field>
                <Field label="إلى">
                  <input type="time" value={form.endTime} required
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
                </Field>
              </div>

              {/* Notes */}
              <Field label="ملاحظات (اختياري)">
                <textarea value={form.notes || ""}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="تجهيزات مطلوبة، عدد الحضور..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
              </Field>

              {/* Conflict error */}
              {conflictMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(220,38,38,0.07)", border: "1px solid #FCA5A5", color: "#DC2626" }}>
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />{conflictMsg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {saving ? "جارٍ الحجز…" : <><CheckCircle className="w-4 h-4" />تأكيد الحجز</>}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid #E9E3FF", color: "#6D28D9" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small helpers ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

function EmptyRooms() {
  return (
    <div className="text-center py-16">
      <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1C4FE" }} />
      <p style={{ color: "#6B6B8A" }}>لا توجد قاعات متاحة</p>
    </div>
  );
}
