"use client";

import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { UserPlus, Pencil, Trash2, Search, X } from "lucide-react";

const roleLabel: Record<string,string> = { ADMIN: "مدير", SUPPORT: "موظف دعم", USER: "مستخدم", COMM_SUPPORT: "دعم الاتصال المؤسسي", COMM_ADMIN: "ادمن الاتصال المؤسسي", DEPT_MANAGER: "مدير قسم" };
const roleBg:    Record<string,string> = { ADMIN: "#EDE9FE", SUPPORT: "#DDD6FE", USER: "#F1F5F9", COMM_SUPPORT: "#FEF3C7", COMM_ADMIN: "#FCE7F3", DEPT_MANAGER: "#FEF3C7" };
const roleFg:    Record<string,string> = { ADMIN: "#5B21B6", SUPPORT: "#6D28D9", USER: "#475569", COMM_SUPPORT: "#92400E", COMM_ADMIN: "#9D174D", DEPT_MANAGER: "#92400E" };

const DEPT_OPTIONS = [
  "الخدمات المشتركة","مكتب الرئيس التنفيذي","المالية","شفاء",
  "تنمية الموارد","التواصل المؤسسي","المراجعة الداخلية","المشاريع","تقنية المعلومات",
];

interface User {
  id: string; name: string; email: string; role: string;
  department: string | null; createdAt: string; _count: { ticketsCreated: number };
}

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users,    setUsers]    = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER", department: "" });

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const openCreate = () => { setEditUser(null); setForm({ name:"", email:"", password:"", role:"USER", department:"" }); setShowForm(true); };
  const openEdit   = (u: User) => { setEditUser(u); setForm({ name:u.name, email:u.email, password:"", role:u.role, department:u.department||"" }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = editUser
        ? await fetch(`/api/users/${editUser.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) })
        : await fetch("/api/users",                 { method:"POST",  headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const user = await res.json();
      if (editUser) { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...user } : u)); toast.success("تم تحديث المستخدم"); }
      else          { setUsers(prev => [{ ...user, _count: { ticketsCreated: 0 } }, ...prev]); toast.success("تم إضافة المستخدم"); }
      setShowForm(false);
    } catch (err: any) { toast.error(err.message || "حدث خطأ"); }
    finally { setLoading(false); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method:"DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("تم الحذف");
    } catch (err: any) { toast.error(err.message || "حدث خطأ"); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو القسم..."
            className="w-full pr-9 pl-8 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-purple-500 whitespace-nowrap">{filtered.length} / {users.length}</span>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm whitespace-nowrap"
          style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
          <UserPlus className="w-4 h-4" />مستخدم جديد
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <h2 className="font-bold mb-4" style={{ color: "#1F1535" }}>{editUser ? "تعديل المستخدم" : "مستخدم جديد"}</h2>
            <form onSubmit={submit} className="space-y-4">
              {[
                { name:"name",     label:"الاسم",              type:"text",     req: true },
                { name:"email",    label:"البريد الإلكتروني",   type:"email",    req: !editUser },
                { name:"password", label: editUser ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور", type:"password", req: !editUser },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })} required={f.req}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>القسم</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}>
                  <option value="">— اختر القسم —</option>
                  {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>الدور</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}>
                  <option value="USER">مستخدم</option>
                  <option value="DEPT_MANAGER">مدير قسم</option>
                  <option value="SUPPORT">موظف دعم</option>
                  <option value="COMM_SUPPORT">دعم الاتصال المؤسسي</option>
                  <option value="COMM_ADMIN">ادمن الاتصال المؤسسي</option>
                  <option value="ADMIN">مدير النظام</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#7C3AED" }}>
                  {loading ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold"
                  style={{ border: "1px solid #E9E3FF", color: "#6D28D9" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="rounded-xl p-4 border border-purple-100" style={{ background: "#FFFFFF" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: "#1F1535" }}>{u.name}</p>
                <p className="text-xs text-purple-500 truncate">{u.email}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-purple-100 rounded-lg" style={{ color: "#7C3AED" }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteUser(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: roleBg[u.role], color: roleFg[u.role] }}>
                {roleLabel[u.role] || u.role}
              </span>
              {u.department && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                  {u.department}
                </span>
              )}
              <span className="text-xs text-purple-400">{u._count.ticketsCreated} تذكرة</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-purple-400">لا توجد نتائج</p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "#F5F3FF", borderBottom: "2px solid #E9E3FF" }}>
            <tr>
              {["الاسم","البريد","الدور","القسم","التذاكر","تاريخ الإنشاء",""].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: "#6D28D9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-purple-50/60 transition-colors bg-white">
                <td className="px-4 py-3 font-semibold" style={{ color: "#1F1535" }}>{u.name}</td>
                <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: roleBg[u.role], color: roleFg[u.role] }}>
                    {roleLabel[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>{u.department || "—"}</td>
                <td className="px-4 py-3" style={{ color: "#6B6B8A" }}>{u._count.ticketsCreated}</td>
                <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors" style={{ color: "#7C3AED" }}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteUser(u.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-purple-400 text-sm">لا توجد نتائج للبحث</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
