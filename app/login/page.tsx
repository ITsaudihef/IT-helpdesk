"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HeadphonesIcon, Lock, Mail, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } else {
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#080820" }}>
      {/* Left panel — brand with gradient */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0728 0%, #1a0845 50%, #0d0728 100%)" }}>
        {/* Glow orbs */}
        <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)" }} />

        <div className="relative text-center text-white px-12 z-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 glow-purple"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
            <HeadphonesIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3 gradient-text">بوابة تذاكر IT</h1>
          <p className="text-base leading-relaxed" style={{ color: "#A78BFA" }}>
            صندوق الوقف الصحي<br />نظام إدارة طلبات الدعم التقني
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { n: "سريع", d: "حل مشاكلك بكفاءة" },
              { n: "آمن",  d: "بيانات محمية بالكامل" },
              { n: "سهل",  d: "واجهة بسيطة وواضحة" },
            ].map((f) => (
              <div key={f.n} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <p className="font-bold text-lg text-white">{f.n}</p>
                <p className="text-xs mt-1" style={{ color: "#A78BFA" }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-xl items-center justify-center mb-3 glow-purple"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
              <HeadphonesIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">بوابة تذاكر IT</h1>
          </div>

          <div className="rounded-2xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF", boxShadow: "0 20px 60px rgba(124,58,237,0.15)" }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: "#1F1535" }}>مرحباً بك</h2>
            <p className="text-sm mb-6" style={{ color: "#7C6A9E" }}>سجّل دخولك للمتابعة</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#7C3AED" }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="example@saudihef.org.sa"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                    style={{ background: "#FAFAFA", border: "1px solid #D1C4FE", color: "#1F1535" }}
                    onFocus={e => (e.target.style.borderColor = "#7C3AED")}
                    onBlur={e => (e.target.style.borderColor = "#D1C4FE")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#7C3AED" }} />
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                    style={{ background: "#FAFAFA", border: "1px solid #D1C4FE", color: "#1F1535" }}
                    onFocus={e => (e.target.style.borderColor = "#7C3AED")}
                    onBlur={e => (e.target.style.borderColor = "#D1C4FE")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#7C3AED" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 mt-2"
                style={{ background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 8px 25px rgba(124,58,237,0.3)" }}>
                {loading ? "جارٍ التحقق..." : "دخول"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            صندوق الوقف الصحي © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
