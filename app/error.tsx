"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#080820" }}>
      <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertTriangle className="w-8 h-8" style={{ color: "#DC2626" }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#1F1535" }}>حدث خطأ غير متوقع</h1>
        <p className="text-sm mb-6" style={{ color: "#7C6A9E" }}>
          نعتذر، حدث خطأ في تحميل الصفحة. يُرجى المحاولة مجدداً.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
