"use client";

import { useState } from "react";
import { CalendarDays, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

interface Toggle {
  key:     string;
  label:   string;
  desc:    string;
  icon:    React.ElementType;
  color:   string;
  bg:      string;
  enabled: boolean;
}

interface Props {
  roomsEnabled: boolean;
}

export default function SettingsToggles({ roomsEnabled }: Props) {
  const [toggles, setToggles] = useState<Toggle[]>([
    {
      key:     "rooms_enabled",
      label:   "حجز القاعات",
      desc:    "السماح للمستخدمين بحجز القاعات وعرض جدول الحجوزات",
      icon:    CalendarDays,
      color:   "#7C3AED",
      bg:      "rgba(124,58,237,0.1)",
      enabled: roomsEnabled,
    },
  ]);

  const toggle = async (key: string) => {
    const t = toggles.find(t => t.key === key);
    if (!t) return;
    const newVal = !t.enabled;

    setToggles(prev => prev.map(x => x.key === key ? { ...x, enabled: newVal } : x));

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newVal ? "true" : "false" }),
      });
      if (!res.ok) throw new Error();
      toast.success(newVal ? `تم تفعيل ${t.label}` : `تم تعطيل ${t.label}`);
    } catch {
      setToggles(prev => prev.map(x => x.key === key ? { ...x, enabled: !newVal } : x));
      toast.error("حدث خطأ، حاول مجدداً");
    }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.12)" }}>
          <ToggleRight className="w-4 h-4" style={{ color: "#7C3AED" }} />
        </div>
        <h2 className="font-bold" style={{ color: "#1F1535" }}>ميزات النظام</h2>
      </div>

      <div className="space-y-3">
        {toggles.map(t => {
          const Icon = t.icon;
          return (
            <div key={t.key}
              className="flex items-center justify-between p-4 rounded-xl transition-all"
              style={{ background: t.enabled ? t.bg : "#F9F7FF", border: `1px solid ${t.enabled ? t.color + "33" : "#E9E3FF"}` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: t.enabled ? t.bg : "#F3F0FF" }}>
                  <Icon className="w-4 h-4" style={{ color: t.enabled ? t.color : "#A0A0BA" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#1F1535" }}>{t.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>{t.desc}</p>
                </div>
              </div>

              <button
                onClick={() => toggle(t.key)}
                className="flex-shrink-0 mr-3 transition-all"
                title={t.enabled ? "إيقاف" : "تفعيل"}>
                {t.enabled
                  ? <ToggleRight className="w-8 h-8" style={{ color: t.color }} />
                  : <ToggleLeft  className="w-8 h-8" style={{ color: "#CBD5E1" }} />
                }
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
        * التغييرات تُطبَّق فوراً على جميع المستخدمين
      </p>
    </div>
  );
}
