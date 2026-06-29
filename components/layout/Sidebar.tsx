"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Ticket, Users, BarChart3, Settings,
  LogOut, HeadphonesIcon, PlusCircle, List, KeyRound, Eye, EyeOff, Menu, X, ShieldCheck, CalendarDays,
} from "lucide-react";
import logoSrc from "@/public/logo.png";
import toast from "react-hot-toast";

interface NavItem { href: string; label: string; icon: React.ElementType; }

const roomsLink: NavItem = { href: "/rooms", label: "حجز القاعات", icon: CalendarDays };

const adminNav: NavItem[] = [
  { href: "/admin",               label: "لوحة التحكم",  icon: LayoutDashboard },
  { href: "/admin/tickets",       label: "جميع التذاكر", icon: Ticket },
  { href: "/admin/reports",       label: "التقارير",      icon: BarChart3 },
  { href: "/admin/users",         label: "المستخدمون",   icon: Users },
  { href: "/admin/departments",   label: "الأقسام",       icon: ShieldCheck },
  { href: "/admin/rooms",         label: "القاعات",       icon: CalendarDays },
  { href: "/admin/settings",      label: "الإعدادات",    icon: Settings },
];
const supportNav: NavItem[] = [
  { href: "/support", label: "تذاكري", icon: HeadphonesIcon },
  roomsLink,
];
const userNav: NavItem[] = [
  { href: "/portal",         label: "الرئيسية",    icon: LayoutDashboard },
  { href: "/portal/new",     label: "تذكرة جديدة", icon: PlusCircle },
  { href: "/portal/tickets", label: "تذاكري",      icon: List },
  roomsLink,
];
const commSupportNav: NavItem[] = [
  { href: "/comm-support",         label: "التذاكر الواردة", icon: HeadphonesIcon },
  { href: "/comm-support/new",     label: "تذكرة جديدة",     icon: PlusCircle },
  { href: "/comm-support/tickets", label: "تذاكري المرفوعة", icon: List },
  roomsLink,
];
const commAdminNav: NavItem[] = [
  { href: "/comm-admin",         label: "بانتظار الاعتماد", icon: LayoutDashboard },
  { href: "/comm-admin/new",     label: "تذكرة جديدة",      icon: PlusCircle },
  { href: "/comm-admin/tickets", label: "جميع التذاكر",     icon: Ticket },
  roomsLink,
];
const deptManagerNav: NavItem[] = [
  { href: "/dept-manager",         label: "لوحة التحكم",  icon: LayoutDashboard },
  { href: "/dept-manager/tickets", label: "تذاكر القسم",  icon: Ticket },
  roomsLink,
];

interface SidebarProps { role: string; userName: string; userEmail: string; roomsEnabled?: boolean; }

export default function Sidebar({ role, userName, userEmail, roomsEnabled = true }: SidebarProps) {
  const pathname = usePathname();

  const filterRooms = (items: NavItem[]) =>
    roomsEnabled ? items : items.filter(i => i.href !== "/rooms");

  const nav = filterRooms(
    role === "ADMIN"        ? adminNav        :
    role === "SUPPORT"      ? supportNav      :
    role === "COMM_SUPPORT" ? commSupportNav  :
    role === "COMM_ADMIN"   ? commAdminNav    :
    role === "DEPT_MANAGER" ? deptManagerNav  : userNav
  );
  const roleLabelMap: Record<string,string> = {
    ADMIN:        "مدير النظام",
    SUPPORT:      "موظف الدعم",
    USER:         "مستخدم",
    COMM_SUPPORT: "دعم الاتصال المؤسسي",
    COMM_ADMIN:   "ادمن الاتصال المؤسسي",
    DEPT_MANAGER: "مدير القسم",
  };
  const roleLabel = roleLabelMap[role] ?? "مستخدم";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);
  const [saving,     setSaving]     = useState(false);

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
    <div className="flex flex-col h-full w-64" style={{ background: "#0a0525", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <Image src={logoSrc} alt="بوابة سند" width={40} height={40} className="rounded-xl object-cover" />
          <div>
            <h1 className="font-bold text-sm text-white">بوابة سند</h1>
            <p className="text-xs" style={{ color: "#A78BFA" }}>كل تحدي وله سند</p>
          </div>
        </div>
        <button className="lg:hidden p-1 rounded-lg" style={{ color: "#A78BFA" }} onClick={() => setMobileOpen(false)}>
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
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all")}
              style={isActive
                ? { background: "linear-gradient(135deg, #7C3AED, #EC4899)", color: "#fff", boxShadow: "0 4px 15px rgba(124,58,237,0.35)" }
                : { color: "#A78BFA" }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.12)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(124,58,237,0.2)", color: "#C4B5FD" }}>
              {roleLabel}
            </span>
          </div>
        </div>
        <button onClick={() => { setShowModal(true); setMobileOpen(false); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-xl transition-all mb-1"
          style={{ color: "#A78BFA" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.12)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <KeyRound className="w-4 h-4" />
          تغيير كلمة المرور
        </button>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 rounded-xl transition-all"
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
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
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-xl"
        style={{ background: "#0a0525", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 4px 15px rgba(124,58,237,0.25)" }}
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* ── Mobile overlay + drawer ── */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden fixed right-0 top-0 h-full z-50 w-64">
            {sidebarContent}
          </div>
        </>
      )}

      {/* ── Change Password Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="rounded-2xl p-6 w-full max-w-sm mx-4" style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                <KeyRound className="w-5 h-5 text-purple-300" />
              </div>
              <h2 className="font-bold text-white">تغيير كلمة المرور</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: "كلمة المرور الحالية", val: currentPw, set: setCurrentPw, show: showCur, toggle: () => setShowCur(v => !v) },
                { label: "كلمة المرور الجديدة", val: newPw,     set: setNewPw,     show: showNew, toggle: () => setShowNew(v => !v) },
                { label: "تأكيد كلمة المرور",   val: confirmPw, set: setConfirmPw, show: showCon, toggle: () => setShowCon(v => !v) },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#A78BFA" }}>{f.label}</label>
                  <div className="relative">
                    <input type={f.show ? "text" : "password"} value={f.val} onChange={e => f.set(e.target.value)} required minLength={6}
                      className="w-full pr-3 pl-10 py-2 rounded-lg text-sm text-white focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.3)" }} />
                    <button type="button" onClick={f.toggle} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A78BFA" }}>
                      {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A78BFA" }}>
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
