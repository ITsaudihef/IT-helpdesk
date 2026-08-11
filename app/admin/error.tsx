"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: "#FFFFFF", border: "1px solid #DCEAD9" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertTriangle className="w-7 h-7" style={{ color: "#DC2626" }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "#16241D" }}>تعذّر تحميل الصفحة</h2>
        <p className="text-sm mb-6" style={{ color: "#5C7A6C" }}>حدث خطأ في لوحة التحكم. يُرجى المحاولة مجدداً.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "#007F5C" }}>
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
          <Link href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#F3F7F1", color: "#007F5C" }}>
            <ArrowRight className="w-3.5 h-3.5" />
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
