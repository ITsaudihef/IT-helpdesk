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
  CRITICAL: "bg-red-100 text-red-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-blue-100 text-blue-700",
  LOW:      "bg-green-100 text-green-700",
};

export const statusBadge: Record<string, string> = {
  OPEN:                  "bg-slate-100 text-slate-700",
  IN_PROGRESS:           "bg-blue-100 text-blue-700",
  PENDING_USER_TEST:     "bg-pink-100 text-pink-700",
  READY_TO_LAUNCH:       "bg-cyan-100 text-cyan-700",
  LAUNCHED:              "bg-emerald-100 text-emerald-700",
  PENDING_DEPT_APPROVAL: "bg-orange-100 text-orange-700",
  PENDING_APPROVAL:      "bg-amber-100 text-amber-700",
  APPROVED:              "bg-emerald-100 text-emerald-700",
  WAITING_INFO:          "bg-purple-100 text-purple-700",
  RESOLVED:              "bg-green-100 text-green-700",
  CLOSED:                "bg-gray-100 text-gray-600",
};

export const statusLabel: Record<string, string> = {
  OPEN:                  "مفتوحة",
  IN_PROGRESS:           "قيد المعالجة",
  PENDING_USER_TEST:     "اختبار قبل الإطلاق",
  READY_TO_LAUNCH:       "جاهزة للإطلاق",
  LAUNCHED:              "تم الإطلاق",
  PENDING_DEPT_APPROVAL: "بانتظار اعتماد المدير",
  PENDING_APPROVAL:      "بانتظار اعتماد التقنية",
  APPROVED:              "معتمدة",
  WAITING_INFO:          "بانتظار معلومات",
  RESOLVED:              "محلولة",
  CLOSED:                "مغلقة",
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
  DEPT_MANAGER: "مدير القسم",
};
