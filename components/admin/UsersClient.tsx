"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

const roleLabel: Record<string,string> = { ADMIN: "مدير", SUPPORT: "موظف دعم", USER: "مستخدم" };
const roleBg:    Record<string,string> = { ADMIN: "#ede9fe", SUPPORT: "#e0f1d0", USER: "#f4f4f5" };
const roleFg:    Record<string,string> = { ADMIN: "#7c3aed", SUPPORT: "#00805b", USER: "#374151" };

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
          style={{ background: "linear-gradient(135deg,#6fb54a,#00805b)" }}>
          <UserPlus className="w-4 h-4" />مستخدم جديد
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editUser ? "تعديل المستخدم" : "مستخدم جديد"}</h2>
            <form onSubmit={submit} className="space-y-4">
              {[
                { name:"name",     label:"الاسم",              type:"text",     req: true },
                { name:"email",    label:"البريد الإلكتروني",   type:"email",    req: !editUser },
                { name:"password", label: editUser ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور", type:"password", req: !editUser },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })} required={f.req}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": "#6fb54a" } as any} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": "#6fb54a" } as any}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="USER">مستخدم</option>
                  <option value="SUPPORT">موظف دعم</option>
                  <option value="ADMIN">مدير</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#6fb54a" }}>
                  {loading ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead style={{ background: "#f4f4f5" }}>
            <tr>
              {["الاسم","البريد","الدور","القسم","التذاكر","تاريخ الإنشاء",""].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-green-50/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: roleBg[u.role], color: roleFg[u.role] }}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.department || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{u._count.ticketsCreated}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 hover:bg-green-100 rounded-lg transition-colors" style={{ color: "#6fb54a" }}>
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
