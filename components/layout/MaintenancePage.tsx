import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#080820" }} dir="rtl">
      <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(124,58,237,0.12)" }}>
          <Wrench className="w-8 h-8" style={{ color: "#7C3AED" }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#1F1535" }}>النظام تحت الصيانة حالياً</h1>
        <p className="text-sm" style={{ color: "#7C6A9E" }}>
          نعتذر عن الإزعاج، يقوم فريق تقنية المعلومات بأعمال صيانة على بوابة سند. يُرجى المحاولة مرة أخرى بعد قليل.
        </p>
      </div>
    </div>
  );
}
