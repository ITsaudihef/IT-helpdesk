"use client";

import { useState } from "react";
import { Wrench, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function MaintenanceModeCard({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving,  setSaving]  = useState(false);

  const toggle = async () => {
    const next = !enabled;
    if (next && !confirm("سيتم إيقاف وصول جميع المستخدمين (عدا مدراء النظام) عن بوابة سند فوراً. هل تريد المتابعة؟")) return;

    setSaving(true);
    setEnabled(next);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "maintenance_mode", value: next ? "true" : "false" }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "تم تفعيل وضع الصيانة" : "تم إنهاء وضع الصيانة");
    } catch {
      setEnabled(!next);
      toast.error("حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: `1px solid ${enabled ? "#FCA5A5" : "#E9E3FF"}` }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }}>
          <Wrench className="w-4 h-4" style={{ color: "#DC2626" }} />
        </div>
        <h2 className="font-bold" style={{ color: "#1F1535" }}>وضع الصيانة</h2>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl transition-all"
        style={{ background: enabled ? "rgba(239,68,68,0.08)" : "#F9F7FF", border: `1px solid ${enabled ? "#FCA5A5" : "#E9E3FF"}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: enabled ? "rgba(239,68,68,0.12)" : "#F3F0FF" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: enabled ? "#DC2626" : "#A0A0BA" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#1F1535" }}>
              {enabled ? "الصيانة مفعّلة الآن" : "إيقاف النظام للصيانة"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>
              يمنع جميع المستخدمين (عدا مدراء النظام) من استخدام البوابة ويعرض لهم صفحة صيانة
            </p>
          </div>
        </div>

        <button onClick={toggle} disabled={saving} className="flex-shrink-0 mr-3 transition-all disabled:opacity-50"
          title={enabled ? "إنهاء الصيانة" : "تفعيل الصيانة"}>
          {enabled
            ? <ToggleRight className="w-8 h-8" style={{ color: "#DC2626" }} />
            : <ToggleLeft  className="w-8 h-8" style={{ color: "#CBD5E1" }} />
          }
        </button>
      </div>
    </div>
  );
}
