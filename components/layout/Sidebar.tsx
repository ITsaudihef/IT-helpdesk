"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Ticket, Users, BarChart3, Settings,
  LogOut, HeadphonesIcon, PlusCircle, List, KeyRound, Eye, EyeOff, Menu, X,
} from "lucide-react";
import toast from "react-hot-toast";

interface NavItem { href: string; label: string; icon: React.ElementType; }

const adminNav: NavItem[] = [
  { href: "/admin",          label: "لوحة التحكم",  icon: LayoutDashboard },
  { href: "/admin/tickets",  label: "جميع التذاكر", icon: Ticket },
  { href: "/admin/reports",  label: "التقارير",      icon: BarChart3 },
  { href: "/admin/users",    label: "المستخدمون",   icon: Users },
  { href: "/admin/settings", label: "الإعدادات",    icon: Settings },
];
const supportNav: NavItem[] = [
  { href: "/support", label: "تذاكري", icon: HeadphonesIcon },
];
const userNav: NavItem[] = [
  { href: "/portal",         label: "الرئيسية",    icon: LayoutDashboard },
  { href: "/portal/new",     label: "تذكرة جديدة", icon: PlusCircle },
  { href: "/portal/tickets", label: "تذاكري",      icon: List },
];
const commSupportNav: NavItem[] = [
  { href: "/comm-support",         label: "التذاكر الواردة", icon: HeadphonesIcon },
  { href: "/comm-support/new",     label: "تذكرة جديدة",     icon: PlusCircle },
  { href: "/comm-support/tickets", label: "تذاكري المرفوعة", icon: List },
];
const commAdminNav: NavItem[] = [
  { href: "/comm-admin",         label: "بانتظار الاعتماد", icon: LayoutDashboard },
  { href: "/comm-admin/new",     label: "تذكرة جديدة",      icon: PlusCircle },
  { href: "/comm-admin/tickets", label: "جميع التذاكر",     icon: Ticket },
];

interface SidebarProps { role: string; userName: string; userEmail: string; }

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const nav =
    role === "ADMIN"        ? adminNav        :
    role === "SUPPORT"      ? supportNav      :
    role === "COMM_SUPPORT" ? commSupportNav  :
    role === "COMM_ADMIN"   ? commAdminNav    : userNav;
  const roleLabelMap: Record<string,string> = {
    ADMIN: "مدير النظام", SUPPORT: "موظف الدعم", USER: "مستخدم",
    COMM_SUPPORT: "دعم الاتصال المؤسسي", COMM_ADMIN: "ادمن الاتصال المؤسسي",
  };
  const roleLabel = roleLabelMap[role] ?? "مستخدم";

  const [mobileOpen, setMobileOpen]         = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [currentPw, setCurrentPw]           = useState("");
  const [newPw,     setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]           = useState("");
  const [showCur,   setShowCur]             = useState(false);
  const [showNew,   setShowNew]             = useState(false);
  const [showCon,   setShowCon]             = useState(false);
  const [saving,    setSaving]              = useState(false);

  const closeModal = () => {
    setShowModal(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("كلمة المرور الجديدة غير متطابقة"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("تم تغيير كلمة المرور بنجاح");
      closeModal();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-64 shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6fb54a, #00805b)" }}>
            <HeadphonesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm" style={{ color: "#1a1a1a" }}>بوابة تذاكر IT</h1>
            <p className="text-xs text-gray-400">صندوق الوقف الصحي</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href.length > 1);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive ? "text-white shadow-sm" : "text-gray-600 hover:bg-green-50 hover:text-green-700"
              )}
              style={isActive ? { background: "linear-gradient(135deg, #6fb54a, #00805b)" } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#6fb54a" }}>
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#e0f1d0", color: "#00805b" }}>
              {roleLabel}
            </span>
          </div>
        </div>
        <button
          onClick={() => { setShowModal(true); setMobileOpen(false); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors mb-1"
        >
          <KeyRound className="w-4 h-4" />
          تغيير كلمة المرور
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixed) ── */}
      <div className="hidden lg:flex fixed right-0 top-0 h-full z-30">
        {sidebarContent}
      </div>

      {/* ── Mobile hamburger button ── */}
      <button
        className="lg:hidden fixed top-4 right-4 z-40 p-2 bg-white border border-gray-200 rounded-xl shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* ── Mobile overlay + drawer ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed right-0 top-0 h-full z-50 w-64">
            {sidebarContent}
          </div>
        </>
      )}

      {/* ── Change Password Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#e0f1d0" }}>
                <KeyRound className="w-5 h-5" style={{ color: "#00805b" }} />
              </div>
              <h2 className="font-bold text-gray-900">تغيير كلمة المرور</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: "كلمة المرور الحالية", val: currentPw, set: setCurrentPw, show: showCur, toggle: () => setShowCur(v => !v) },
                { label: "كلمة المرور الجديدة", val: newPw,     set: setNewPw,     show: showNew, toggle: () => setShowNew(v => !v) },
                { label: "تأكيد كلمة المرور",   val: confirmPw, set: setConfirmPw, show: showCon, toggle: () => setShowCon(v => !v) },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.show ? "text" : "password"}
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      required minLength={6}
                      className="w-full pr-3 pl-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "#6fb54a" } as any}
                    />
                    <button type="button" onClick={f.toggle}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#6fb54a" }}>
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
