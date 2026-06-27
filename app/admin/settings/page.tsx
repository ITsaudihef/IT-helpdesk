export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-white">إعدادات النظام</h1>
      <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <h2 className="font-medium text-white mb-4">أنواع التذاكر</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: "HARDWARE", label: "أجهزة", icon: "🖥️" },
            { value: "SOFTWARE", label: "برمجيات", icon: "💾" },
            { value: "NETWORK", label: "شبكة", icon: "🌐" },
            { value: "ACCESS", label: "صلاحيات", icon: "🔐" },
            { value: "OTHER", label: "أخرى", icon: "📋" },
          ].map((t) => (
            <div key={t.value} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/8">
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="text-xs text-purple-500">{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <h2 className="font-medium text-white mb-4">مستويات الأولوية</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: "LOW", label: "منخفضة", color: "bg-purple-900 text-green-700 border-green-200" },
            { value: "MEDIUM", label: "متوسطة", color: "bg-blue-100 text-blue-700 border-blue-200" },
            { value: "HIGH", label: "عالية", color: "bg-orange-100 text-orange-700 border-orange-200" },
            { value: "CRITICAL", label: "حرجة", color: "bg-red-100 text-red-700 border-red-200" },
          ].map((p) => (
            <div key={p.value} className={`p-3 rounded-lg border text-center ${p.color}`}>
              <p className="text-sm font-bold">{p.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{p.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <h2 className="font-medium text-white mb-2">إعدادات البريد الإلكتروني</h2>
        <p className="text-sm text-purple-400 mb-4">إعدادات Nodemailer لإشعارات تغيير الحالة</p>
        <div className="bg-white/5 rounded-lg p-4 font-mono text-xs text-purple-300 space-y-1">
          <p>SMTP_HOST = {process.env.SMTP_HOST || "smtp.gmail.com"}</p>
          <p>SMTP_PORT = {process.env.SMTP_PORT || "587"}</p>
          <p>SMTP_USER = {process.env.SMTP_USER ? "✓ محدد" : "❌ غير محدد"}</p>
        </div>
      </div>
    </div>
  );
}
