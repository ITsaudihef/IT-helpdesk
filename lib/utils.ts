import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "short",
  }).format(new Date(date));
}

export const priorityColors: Record<string, string> = {
  CRITICAL: "border-r-red-500",
  HIGH:     "border-r-orange-500",
  MEDIUM:   "border-r-blue-500",
  LOW:      "border-r-green-500",
};

export const priorityBadge: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-300",
  HIGH:     "bg-orange-500/15 text-orange-300",
  MEDIUM:   "bg-blue-500/15 text-blue-300",
  LOW:      "bg-green-500/15 text-green-300",
};

export const statusBadge: Record<string, string> = {
  OPEN:             "bg-slate-500/15 text-slate-300",
  IN_PROGRESS:      "bg-blue-500/15 text-blue-300",
  PENDING_APPROVAL: "bg-amber-500/15 text-amber-300",
  APPROVED:         "bg-emerald-500/15 text-emerald-300",
  WAITING_INFO:     "bg-purple-500/15 text-purple-300",
  RESOLVED:         "bg-green-500/15 text-green-300",
  CLOSED:           "bg-slate-500/10 text-slate-400",
};

export const statusLabel: Record<string, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد المعالجة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمدة",
  WAITING_INFO: "بانتظار معلومات",
  RESOLVED: "محلولة",
  CLOSED: "مغلقة",
};

export const priorityLabel: Record<string, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  CRITICAL: "حرجة",
};

export const typeLabel: Record<string, string> = {
  SUPPORT:              "دعم فني",
  SHIFA_SUPPORT:        "دعم فني - شفاء",
  DEVELOPMENT:          "تطوير",
  INSTITUTIONAL_COMM:   "طلب تصميم",
  // legacy values kept for existing tickets
  HARDWARE: "أجهزة",
  SOFTWARE: "برمجيات",
  NETWORK:  "شبكة",
  ACCESS:   "صلاحيات",
  OTHER:    "أخرى",
};

export const roleLabel: Record<string, string> = {
  ADMIN:        "مدير النظام",
  SUPPORT:      "موظف الدعم",
  USER:         "مستخدم",
  COMM_SUPPORT: "دعم الاتصال المؤسسي",
  COMM_ADMIN:   "ادمن الاتصال المؤسسي",
};
