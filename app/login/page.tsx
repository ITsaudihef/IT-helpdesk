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
    <div className="min-h-screen flex" dir="rtl">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #6fb54a 0%, #00805b 100%)" }}>
        {/* decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20" style={{ background: "#fff" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-10" style={{ background: "#fff" }} />
        <div className="relative text-center text-white px-12">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <HeadphonesIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">بوابة تذاكر IT</h1>
          <p className="text-green-100 text-base leading-relaxed">
            صندوق الوقف الصحي<br />نظام إدارة طلبات الدعم التقني
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { n: "سريع", d: "حل مشاكلك بكفاءة" },
              { n: "آمن",  d: "بيانات محمية بالكامل" },
              { n: "سهل",  d: "واجهة بسيطة وواضحة" },
            ].map((f) => (
              <div key={f.n} className="bg-white/10 rounded-xl p-3">
                <p className="font-bold text-lg">{f.n}</p>
                <p className="text-xs text-green-100 mt-1">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f4f4f5]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-xl items-center justify-center mb-3 shadow"
              style={{ background: "linear-gradient(135deg, #6fb54a, #00805b)" }}>
              <HeadphonesIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">بوابة تذاكر IT</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">مرحباً بك</h2>
            <p className="text-sm text-gray-500 mb-6">سجّل دخولك للمتابعة</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="example@hef.org.sa"
                    className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": "#6fb54a" } as any}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                    className="w-full pr-10 pl-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 mt-2 shadow-sm"
                style={{ background: loading ? "#9dd274" : "linear-gradient(135deg, #6fb54a, #00805b)" }}>
                {loading ? "جارٍ التحقق..." : "دخول"}
              </button>
            </form>

          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            صندوق الوقف الصحي © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
