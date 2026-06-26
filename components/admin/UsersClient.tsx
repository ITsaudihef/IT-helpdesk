"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

const roleLabel: Record<string,string> = { ADMIN: "مدير", SUPPORT: "موظف دعم", USER: "مستخدم", COMM_SUPPORT: "دعم الاتصال المؤسسي", COMM_ADMIN: "ادمن الاتصال المؤسسي" };
const roleBg:    Record<string,string> = { ADMIN: "#ede9fe", SUPPORT: "rgba(124,58,237,0.12)", USER: "#f4f4f5", COMM_SUPPORT: "#fef9c3", COMM_ADMIN: "#fce7f3" };
const roleFg:    Record<string,string> = { ADMIN: "#7c3aed", SUPPORT: "#5B21B6", USER: "#374151", COMM_SUPPORT: "#a16207", COMM_ADMIN: "#9d174d" };

interface User {
  id: string; name: string; email: string; role: string;
  department: string | null; createdAt: string; _count: { ticketsCreated: number };
}

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users,    setUsers]    = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER", department: "" });

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
    try { await fetch(`/api/users/${id}`, { method:"DELETE" }); setUsers(prev => prev.filter(u => u.id !== id)); toast.success("تم الحذف"); }
    catch { toast.error("حدث خطأ"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
          <UserPlus className="w-4 h-4" />مستخدم جديد
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="font-bold text-white mb-4">{editUser ? "تعديل المستخدم" : "مستخدم جديد"}</h2>
            <form onSubmit={submit} className="space-y-4">
              {[
                { name:"name",     label:"الاسم",              type:"text",     req: true },
                { name:"email",    label:"البريد الإلكتروني",   type:"email",    req: !editUser },
                { name:"password", label: editUser ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور", type:"password", req: !editUser },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-purple-200 mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })} required={f.req}
                    className="w-full px-3 py-2 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": "#7C3AED" } as any} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">القسم</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-white/8 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": "#7C3AED" } as any}>
                  <option value="">— اختر القسم —</option>
                  <option value="الخدمات المشتركة">الخدمات المشتركة</option>
                  <option value="مكتب الرئيس التنفيذي">مكتب الرئيس التنفيذي</option>
                  <option value="المالية">المالية</option>
                  <option value="شفاء">شفاء</option>
                  <option value="تنمية الموارد">تنمية الموارد</option>
                  <option value="التواصل المؤسسي">التواصل المؤسسي</option>
                  <option value="المراجعة الداخلية">المراجعة الداخلية</option>
                  <option value="المشاريع">المشاريع</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الدور</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-white/8 rounded-lg text-sm">
                  <option value="USER">مستخدم</option>
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
                  className="flex-1 border border-white/8 text-purple-200 py-2 rounded-lg text-sm hover:bg-white/5">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "#0a0320" }}>
            <tr>
              {["الاسم","البريد","الدور","القسم","التذاكر","تاريخ الإنشاء",""].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-purple-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-purple-900/15 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                <td className="px-4 py-3 text-purple-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: roleBg[u.role], color: roleFg[u.role] }}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-purple-400">{u.department || "—"}</td>
                <td className="px-4 py-3 text-purple-400">{u._count.ticketsCreated}</td>
                <td className="px-4 py-3 text-purple-500">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 hover:bg-purple-900 rounded-lg transition-colors" style={{ color: "#7C3AED" }}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteUser(u.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
