"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowLeft, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";

export default function FamilyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (!email || !password) {
        setErrorMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        setLoading(false);
        return;
      }

      // Hook for optional 2FA verification
      if (email.endsWith("@2fa.test") && !requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      // Mock user login and consent check
      const consented = document.cookie.includes("med_consent_accepted=true");
      
      // Store session state in cookie/localStorage
      localStorage.setItem("med_user_email", email);
      document.cookie = "med_auth_session=active; path=/; max-age=86400; SameSite=Lax";

      if (consented) {
        router.push("/family");
      } else {
        router.push("/consent");
      }
    } catch {
      setErrorMessage("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Open signup/login with Google
    localStorage.setItem("med_user_email", "google.user@example.com");
    document.cookie = "med_auth_session=active; path=/; max-age=86400; SameSite=Lax";
    const consented = document.cookie.includes("med_consent_accepted=true");
    if (consented) {
      router.push("/family");
    } else {
      router.push("/consent");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-2xl shadow-md shadow-teal-600/20 mb-4">
          M
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">تسجيل الدخول · فضاء العائلة</h1>
        <p className="mt-2 text-xs text-slate-500">
          تابع صحتك وصحة أطفالك وسجلاتهم بكل خصوصية
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-3xl sm:px-10">
          
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-3 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>متابعة باستخدام حساب Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">أو عبر البريد الإلكتروني</span>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pr-10 pl-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Optional 2FA Hook */}
            {requires2FA && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2">
                <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>رمز التحقق بخطوتين (2FA)</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-base font-bold py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            ليس لديك حساب عائلي؟{" "}
            <Link href="/signup" className="text-teal-600 font-bold hover:underline">
              أنشئ حسابك مجاناً الآن
            </Link>
          </div>
        </div>

        {/* Link to Clinic Gateway */}
        <div className="text-center mt-6">
          <Link
            href="/clinic"
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            أنت طبيب أو موظف عيادة؟ ادخل من بوابة العيادات بالدعوة
          </Link>
        </div>
      </div>
    </div>
  );
}
