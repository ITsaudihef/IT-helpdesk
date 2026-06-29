"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Users, MapPin, CalendarDays, Clock } from "lucide-react";

interface Room {
  id: string;
  name: string;
  capacity: number;
  features: string;
  location: string | null;
  isActive: boolean;
}

interface Booking {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: { name: string };
  user: { name: string };
}

interface Props { initialRooms: Room[]; initialBookings: Booking[] }

const emptyForm = { name: "", capacity: "10", features: "", location: "", isActive: true };

export default function AdminRoomsClient({ initialRooms, initialBookings }: Props) {
  const [rooms,    setRooms]    = useState(initialRooms);
  const [bookings, setBookings] = useState(initialBookings);
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState<"rooms" | "bookings">("rooms");

  const openCreate = () => { setEditRoom(null); setForm(emptyForm); setShowForm(true); };
  const openEdit   = (r: Room) => {
    setEditRoom(r);
    setForm({ name: r.name, capacity: String(r.capacity), features: r.features, location: r.location || "", isActive: r.isActive });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, capacity: parseInt(form.capacity) || 10 };
      const res = editRoom
        ? await fetch(`/api/rooms/${editRoom.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/rooms",                 { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const room = await res.json();
      if (editRoom) {
        setRooms(prev => prev.map(r => r.id === room.id ? room : r));
        toast.success("تم تحديث القاعة");
      } else {
        setRooms(prev => [...prev, room]);
        toast.success("تمت إضافة القاعة");
      }
      setShowForm(false);
    } catch (err: any) { toast.error(err.message || "حدث خطأ"); }
    finally { setSaving(false); }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القاعة؟")) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      setRooms(prev => prev.filter(r => r.id !== id));
      toast.success("تم حذف القاعة");
    } catch { toast.error("حدث خطأ"); }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success("تم إلغاء الحجز");
    } catch { toast.error("حدث خطأ"); }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "إجمالي القاعات",   value: rooms.length,                              color: "#7C3AED" },
          { label: "قاعات نشطة",       value: rooms.filter(r => r.isActive).length,      color: "#16A34A" },
          { label: "حجوزات قادمة",     value: bookings.length,                           color: "#EA580C" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {[{ key: "rooms", label: "القاعات" }, { key: "bookings", label: "الحجوزات القادمة" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === t.key ? { background: "#7C3AED", color: "#fff" } : { background: "#F5F3FF", color: "#7C3AED" }}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "rooms" && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
            <Plus className="w-4 h-4" />قاعة جديدة
          </button>
        )}
      </div>

      {/* ── Rooms Tab ── */}
      {tab === "rooms" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map(r => {
            const features = r.features ? r.features.split(",") : [];
            return (
              <div key={r.id} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: `1px solid ${r.isActive ? "#E9E3FF" : "#FEE2E2"}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold" style={{ color: "#1F1535" }}>{r.name}</h3>
                      {!r.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          معطلة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#6B6B8A" }}>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.capacity} أشخاص</span>
                      {r.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                    <button onClick={() => openEdit(r)}
                      className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors" style={{ color: "#7C3AED" }}
                      title="تعديل">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRoom(r.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                      title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {features.map(f => (
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
          {rooms.length === 0 && (
            <div className="col-span-2 text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
              <p style={{ color: "#7C6A9E" }}>لا توجد قاعات — أضف قاعة جديدة</p>
            </div>
          )}
        </div>
      )}

      {/* ── Bookings Tab ── */}
      {tab === "bookings" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1C4FE" }} />
              <p style={{ color: "#7C6A9E" }}>لا توجد حجوزات قادمة</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ background: "#F5F3FF", borderBottom: "2px solid #E9E3FF" }}>
                <tr>
                  {["العنوان","القاعة","الحاجز","التاريخ","الوقت",""].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#6D28D9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-4 py-3 font-semibold" style={{ color: "#1F1535" }}>{b.title}</td>
                    <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>{b.room.name}</td>
                    <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>{b.user.name}</td>
                    <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{b.date}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.startTime}–{b.endTime}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => cancelBooking(b.id)}
                        className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                        style={{ background: "#FEE2E2", color: "#DC2626" }}>
                        إلغاء
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Room Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="rounded-2xl w-full max-w-md shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F3F0FF" }}>
              <h2 className="font-bold" style={{ color: "#1F1535" }}>
                {editRoom ? "تعديل القاعة" : "قاعة جديدة"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-purple-50">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {[
                { key: "name",     label: "اسم القاعة",            type: "text",   req: true,  placeholder: "مثال: قاعة الاجتماعات A" },
                { key: "capacity", label: "السعة (عدد الأشخاص)",   type: "number", req: true,  placeholder: "10" },
                { key: "location", label: "الموقع (اختياري)",      type: "text",   req: false, placeholder: "الطابق الأول" },
                { key: "features", label: "المميزات (اختياري)",    type: "text",   req: false, placeholder: "بروجكتور, تكييف, لوح كتابة" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.req} placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-purple-600" />
                <label htmlFor="isActive" className="text-sm font-medium" style={{ color: "#374151" }}>القاعة نشطة ومتاحة للحجز</label>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
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
