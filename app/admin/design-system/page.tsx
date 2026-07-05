"use client";

import { useState } from "react";
import { Check, Copy, Palette } from "lucide-react";
import toast from "react-hot-toast";

// ── Design tokens — the actual values in production use, gathered from a codebase audit ──

const BRAND = [
  { name: "Primary Purple",  hex: "#7C3AED", usage: "أزرار أساسية، روابط نشطة، لون العلامة الرئيسي" },
  { name: "Dark Purple",     hex: "#5B21B6", usage: "نص مميز، لوحات معلوماتية، حالة hover الداكنة" },
  { name: "Pink Accent",     hex: "#EC4899", usage: "الطرف الثاني لتدرّج الأزرار الأساسية" },
  { name: "Sidebar Dark",    hex: "#0a0525", usage: "خلفية الشريط الجانبي فقط" },
  { name: "Modal Dark",      hex: "#100835", usage: "خلفية النوافذ المنبثقة الداكنة (dark-modal)" },
];

const NEUTRAL = [
  { name: "Page Background", hex: "#F5F3FF", usage: "خلفية الصفحة الأساسية" },
  { name: "Card Background", hex: "#FFFFFF", usage: "خلفية البطاقات والنوافذ الفاتحة" },
  { name: "Border",          hex: "#E9E3FF", usage: "حدود البطاقات وحقول الإدخال" },
  { name: "Text Primary",    hex: "#1F1535", usage: "العناوين والنص الأساسي" },
  { name: "Text Secondary",  hex: "#6D28D9", usage: "نص ثانوي بلون العلامة" },
  { name: "Text Muted",      hex: "#7C6A9E", usage: "نص خافت / أوصاف ثانوية" },
];

const SEMANTIC = [
  { name: "نجاح / منخفضة",  hex: "#16A34A", bg: "#D1FAE5" },
  { name: "معلومة / متوسطة", hex: "#2563EB", bg: "#DBEAFE" },
  { name: "تحذير / عالية",  hex: "#C2410C", bg: "#FFEDD5" },
  { name: "خطر / حرجة",     hex: "#DC2626", bg: "#FEF2F2" },
];

const RADIUS = [
  { name: "rounded-lg",  className: "rounded-lg",  usage: "شارات صغيرة، أزرار مضغوطة" },
  { name: "rounded-xl",  className: "rounded-xl",  usage: "حقول الإدخال، النوافذ الصغيرة، عناصر القائمة الجانبية" },
  { name: "rounded-2xl", className: "rounded-2xl", usage: "البطاقات، النوافذ الكبيرة، أقسام الصفحة" },
  { name: "rounded-full",className: "rounded-full",usage: "الصور الرمزية، النقاط، الشارات الدائرية" },
];

function Swatch({ name, hex, usage, bg }: { name: string; hex: string; usage?: string; bg?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    toast.success(`تم نسخ ${hex}`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="text-right rounded-xl p-3 flex items-center gap-3 transition-all hover:shadow-md w-full"
      style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <div className="w-10 h-10 rounded-lg flex-shrink-0 border" style={{ background: bg ?? hex, borderColor: "#E9E3FF" }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: "#1F1535" }}>{name}</p>
        {usage && <p className="text-xs mt-0.5 truncate" style={{ color: "#7C6A9E" }}>{usage}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs font-mono" style={{ color: "#7C3AED" }}>{hex}</span>
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />}
      </div>
    </button>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-1" style={{ color: "#1F1535" }}>{title}</h2>
      {desc && <p className="text-sm mb-4" style={{ color: "#7C6A9E" }}>{desc}</p>}
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div dir="rtl">
      {/* Intro */}
      <div className="rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
          <Palette className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">نظام التصميم — بوابة سند</h1>
          <p className="text-sm text-white/80 mt-0.5">
            القيم الفعلية المستخدمة في الكود (تم استخراجها بتدقيق شامل) — مرجع جاهز للمشاركة مع مصممي UX/UI. اضغط أي لون لنسخ قيمته.
          </p>
        </div>
      </div>

      {/* Brand colors */}
      <Section title="ألوان العلامة" desc="اللوحة الأساسية المستخدمة في كل الأزرار والعناصر التفاعلية">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRAND.map(c => <Swatch key={c.hex} {...c} />)}
        </div>
      </Section>

      {/* Neutral colors */}
      <Section title="ألوان محايدة" desc="الخلفيات والنصوص والحدود">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEUTRAL.map(c => <Swatch key={c.hex} {...c} />)}
        </div>
      </Section>

      {/* Semantic / status colors */}
      <Section title="ألوان الحالة (موحّدة عبر التذاكر والمشاريع ولوحة كانبان)"
        desc="نفس الترميز اللوني بالضبط: أخضر=نجاح/منخفضة، أزرق=معلومة/متوسطة، برتقالي=تحذير/عالية، أحمر=خطر/حرجة">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SEMANTIC.map(c => (
            <div key={c.hex} className="rounded-xl p-4 text-center" style={{ background: c.bg, border: `1px solid ${c.hex}33` }}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ background: c.hex, color: "#fff" }}>
                {c.name}
              </span>
              <p className="text-xs font-mono" style={{ color: c.hex }}>{c.hex}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="الخطوط" desc="خط واحد موحّد لكامل المنصة — Segoe UI">
        <div className="rounded-2xl p-6 space-y-3" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <p className="text-2xl font-bold" style={{ color: "#1F1535" }}>عنوان رئيسي — Segoe UI Bold</p>
          <p className="text-lg font-semibold" style={{ color: "#1F1535" }}>عنوان فرعي — Segoe UI Semibold</p>
          <p className="text-sm" style={{ color: "#1F1535" }}>نص أساسي — يستخدم لكل محتوى الصفحات والنماذج</p>
          <p className="text-xs" style={{ color: "#7C6A9E" }}>نص ثانوي خافت — أوصاف وتلميحات</p>
        </div>
      </Section>

      {/* Radius */}
      <Section title="زوايا الاستدارة" desc="أربع قيم فقط، مستخدمة عبر Tailwind classes بشكل ثابت">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {RADIUS.map(r => (
            <div key={r.name} className={`p-4 text-center ${r.className}`} style={{ background: "#EDE9FE" }}>
              <p className="text-sm font-bold font-mono" style={{ color: "#7C3AED" }}>{r.name}</p>
              <p className="text-xs mt-1" style={{ color: "#7C6A9E" }}>{r.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="الأزرار" desc="زر أساسي واحد موحّد — لا تستخدم تدرجات بديلة لنفس الدور">
        <div className="rounded-2xl p-6 flex flex-wrap items-center gap-3" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            زر أساسي
          </button>
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-purple-50"
            style={{ color: "#7C3AED", border: "1px solid #E9E3FF" }}>
            زر ثانوي (Outline)
          </button>
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#DC2626" }}>
            زر خطر (حذف)
          </button>
          <button disabled className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white opacity-40"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            زر معطّل
          </button>
        </div>
      </Section>

      {/* Cards & Modals */}
      <Section title="البطاقات والنوافذ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "#1F1535" }}>بطاقة فاتحة (Card)</p>
            <p className="text-xs" style={{ color: "#7C6A9E" }}>خلفية بيضاء + حدود بنفسجية فاتحة — الأكثر استخداماً في المنصة</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.3)" }}>
            <p className="text-sm font-bold mb-1 text-white">نافذة داكنة (Dark Modal)</p>
            <p className="text-xs" style={{ color: "#A78BFA" }}>
              تنبيه مهم: أي نص أبيض داخل نافذة داكنة يجب أن يكون ضمن عنصر بصنف <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.1)" }}>dark-modal</code> — بدونه تفرض قاعدة CSS عامة لون نص داكن فيختفي على الخلفية الداكنة.
            </p>
          </div>
        </div>
      </Section>

      {/* Form inputs */}
      <Section title="حقول الإدخال">
        <div className="rounded-2xl p-6 space-y-4 max-w-md" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <input placeholder="حقل نصي..." readOnly
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#FAFAFA", border: "1px solid #D1C4FE", color: "#1F1535" }} />
          <select className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "#FAFAFA", border: "1px solid #D1C4FE", color: "#1F1535" }}>
            <option>قائمة اختيار...</option>
          </select>
        </div>
      </Section>

      {/* Guidance footer */}
      <div className="rounded-2xl p-5 text-sm" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
        <strong>ملاحظة للتطوير:</strong> معظم الألوان في الكود مكتوبة كقيم hex مباشرة داخل <code>style=</code> بدل متغيرات CSS. هذه الصفحة توثّق القيم الفعلية المعتمدة — عند إضافة ميزة جديدة، استخدم نفس القيم بالضبط بدل اختيار درجة قريبة عشوائياً.
      </div>
    </div>
  );
}
