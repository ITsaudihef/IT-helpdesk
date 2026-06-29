"use client";

import { useState } from "react";
import { Users, ShieldCheck, UserPlus, X, ChevronDown, ChevronUp, Building2, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string; name: string; email: string; role: string; department: string | null;
}
interface Dept {
  name: string;
  employees: User[];
  managers: User[];
}

const PRESET_DEPTS = [
  "الخدمات المشتركة", "مكتب الرئيس التنفيذي", "المالية", "شفاء",
  "تنمية الموارد", "التواصل المؤسسي", "المراجعة الداخلية", "المشاريع", "تقنية المعلومات",
];

const roleColor: Record<string, { bg: string; fg: string; label: string }> = {
  ADMIN:        { bg: "#EDE9FE", fg: "#5B21B6", label: "مدير النظام" },
  SUPPORT:      { bg: "#DDD6FE", fg: "#6D28D9", label: "موظف دعم" },
  DEPT_MANAGER: { bg: "#FEF3C7", fg: "#92400E", label: "مدير القسم" },
  USER:         { bg: "#F1F5F9", fg: "#475569", label: "مستخدم" },
  COMM_SUPPORT: { bg: "#FEF3C7", fg: "#92400E", label: "دعم اتصال مؤسسي" },
  COMM_ADMIN:   { bg: "#FCE7F3", fg: "#9D174D", label: "ادمن اتصال مؤسسي" },
};

export default function DepartmentsClient({ departments, allUsers }: { departments: Dept[]; allUsers: User[] }) {
  const [depts,        setDepts]       = useState(departments);
  const [expanded,     setExpanded]    = useState<string | null>(null);
  const [modal,        setModal]       = useState<{ dept: Dept } | null>(null);
  const [saving,       setSaving]      = useState(false);

  const toggleExpand = (name: string) => setExpanded(e => e === name ? null : name);

  // Assign / demote manager
  const assignManager = async (userId: string, dept: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "DEPT_MANAGER", department: dept }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setDepts(prev => prev.map(d => {
        if (d.name !== dept) return d;
        const employees = d.employees.map(u => u.id === userId ? { ...u, role: "DEPT_MANAGER" } : u);
        const managers = employees.filter(u => u.role === "DEPT_MANAGER");
        return { ...d, employees, managers };
      }));
      toast.success(`تم تعيين ${updated.name} مديراً للقسم`);
    } catch {
      toast.error("حدث خطأ أثناء التعيين");
    } finally {
      setSaving(false);
    }
  };

  const demoteManager = async (userId: string, dept: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "USER" }),
      });
      if (!res.ok) throw new Error();
      setDepts(prev => prev.map(d => {
        if (d.name !== dept) return d;
        const employees = d.employees.map(u => u.id === userId ? { ...u, role: "USER" } : u);
        const managers = employees.filter(u => u.role === "DEPT_MANAGER");
        return { ...d, employees, managers };
      }));
      toast.success("تم إزالة صلاحيات مدير القسم");
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  // Move user to department
  const moveUserToDept = async (userId: string, newDept: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: newDept }),
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "عدد الأقسام",      value: depts.filter(d => d.name !== "بدون قسم").length, color: "#7C3AED" },
          { label: "إجمالي الموظفين",  value: allUsers.length,                                    color: "#3B82F6" },
          { label: "مدراء أقسام",      value: allUsers.filter(u => u.role === "DEPT_MANAGER").length, color: "#92400E" },
          { label: "بدون قسم",         value: allUsers.filter(u => !u.department).length,          color: "#6B7280" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border border-purple-100" style={{ background: "#FFFFFF" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-purple-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Department cards */}
      <div className="space-y-3">
        {depts.map(dept => {
          const isOpen = expanded === dept.name;
          const hasManager = dept.managers.length > 0;
          return (
            <div key={dept.name} className="rounded-2xl overflow-hidden border" style={{ background: "#FFFFFF", borderColor: hasManager ? "#E9E3FF" : "#FEE2E2" }}>
              {/* Header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: hasManager ? "rgba(124,58,237,0.1)" : "rgba(239,68,68,0.08)" }}>
                  <Building2 className="w-5 h-5" style={{ color: hasManager ? "#7C3AED" : "#DC2626" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold" style={{ color: "#1F1535" }}>{dept.name}</h3>
                    {!hasManager && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                        بدون مدير
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-purple-500">{dept.employees.length} موظف</span>
                    {hasManager && dept.managers.map(m => (
                      <span key={m.id} className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: "#92400E" }}>
                        <Crown className="w-3 h-3" />
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setModal({ dept })}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>
                    {hasManager ? "تغيير المدير" : "تعيين مدير"}
                  </button>
                  <button onClick={() => toggleExpand(dept.name)}
                    className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors" style={{ color: "#7C3AED" }}>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded employee list */}
              {isOpen && (
                <div className="border-t border-purple-100">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-purple-500">موظفو القسم ({dept.employees.length})</p>
                  </div>
                  <ul className="divide-y divide-purple-50">
                    {dept.employees.length === 0 ? (
                      <li className="px-5 py-4 text-sm text-purple-400 text-center">لا يوجد موظفون في هذا القسم</li>
                    ) : dept.employees.map(emp => {
                      const rc = roleColor[emp.role] || roleColor["USER"];
                      const isManager = emp.role === "DEPT_MANAGER";
                      return (
                        <li key={emp.id} className="flex items-center gap-3 px-5 py-3 hover:bg-purple-50/50 transition-colors">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: "#1F1535" }}>
                              {emp.name}
                              {isManager && <Crown className="w-3 h-3 text-amber-500" />}
                            </p>
                            <p className="text-xs text-purple-500 truncate">{emp.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: rc.bg, color: rc.fg }}>
                              {rc.label}
                            </span>
                            {dept.name !== "بدون قسم" && (
                              isManager ? (
                                <button onClick={() => demoteManager(emp.id, dept.name)} disabled={saving}
                                  className="text-xs px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
                                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
                                  إزالة المدير
                                </button>
                              ) : (
                                <button onClick={() => assignManager(emp.id, dept.name)} disabled={saving}
                                  className="text-xs px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
                                  style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED" }}>
                                  تعيين مديراً
                                </button>
                              )
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign Manager Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: "#1F1535" }}>تعيين مدير القسم</h2>
                  <p className="text-xs text-purple-500">{modal.dept.name}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current managers */}
            {modal.dept.managers.length > 0 && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: "#FEF3C7" }}>
                <p className="text-xs font-semibold text-amber-700 mb-2">المدراء الحاليون:</p>
                {modal.dept.managers.map(m => (
                  <div key={m.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-800 flex items-center gap-1">
                      <Crown className="w-3 h-3" />{m.name}
                    </span>
                    <button onClick={() => { demoteManager(m.id, modal.dept.name); setModal(null); }} disabled={saving}
                      className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      إزالة
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-purple-600 mb-3">اختر موظفاً من القسم لتعيينه مديراً:</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {modal.dept.employees
                .filter(u => u.role !== "DEPT_MANAGER" && u.role !== "ADMIN")
                .map(emp => (
                  <li key={emp.id}>
                    <button onClick={() => { assignManager(emp.id, modal.dept.name); setModal(null); }} disabled={saving}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-all text-right"
                      style={{ border: "1px solid #E9E3FF" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#1F1535" }}>{emp.name}</p>
                        <p className="text-xs text-purple-500">{emp.email}</p>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                    </button>
                  </li>
                ))}
              {modal.dept.employees.filter(u => u.role !== "DEPT_MANAGER" && u.role !== "ADMIN").length === 0 && (
                <p className="text-sm text-center text-purple-400 py-4">لا يوجد موظفون آخرون في هذا القسم</p>
              )}
            </ul>

            <button onClick={() => setModal(null)} className="mt-4 w-full py-2 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid #E9E3FF", color: "#6D28D9" }}>
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
