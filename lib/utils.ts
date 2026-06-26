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
  CRITICAL: "border-red-500 bg-red-50",
  HIGH: "border-orange-500 bg-orange-50",
  MEDIUM: "border-blue-500 bg-blue-50",
  LOW: "border-green-500 bg-green-50",
};

export const priorityBadge: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  LOW: "bg-green-100 text-green-800",
};

export const statusBadge: Record<string, string> = {
  OPEN: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  WAITING_INFO: "bg-purple-100 text-purple-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-100 text-slate-800",
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
  INSTITUTIONAL_COMM:   "تواصل مؤسسي",
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
  COMM_SUPPORT: "دعم فني - التواصل",
  COMM_ADMIN:   "ادمن التواصل",
};
