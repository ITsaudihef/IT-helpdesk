import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#071711" }} dir="rtl">
      <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: "#FFFFFF", border: "1px solid #DCEAD9" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(0,127,92,0.12)" }}>
          <Wrench className="w-8 h-8" style={{ color: "#007F5C" }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#16241D" }}>النظام تحت الصيانة حالياً</h1>
        <p className="text-sm" style={{ color: "#5C7A6C" }}>
          نعتذر عن الإزعاج، يقوم فريق تقنية المعلومات بأعمال صيانة على بوابة الدعم الفني. يُرجى المحاولة مرة أخرى بعد قليل.
        </p>
      </div>
    </div>
  );
}
