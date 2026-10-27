"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Stethoscope,
  Users,
  ShieldAlert,
  ArrowRight,
  Mail,
  Lock,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CLINIC_ROUTING_ROLES, getClinicRoleDetails } from "./roles";

export default function ClinicGatewayPage() {
  const [selectedRole, setSelectedRole] = useState<string>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const roleDetails = getClinicRoleDetails(selectedRole);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("بوابة العيادات قيد التفعيل التجريبي للمؤسسات المدعوة فقط. يرجى مراجعة رابط الدعوة المرسل لبريدك الإلكتروني.");
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setIsContactModalOpen(false);
      setContactSuccess(false);
      setClinicName("");
      setContactPhone("");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between" dir="rtl">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg">منظومة العيادات والمراكز الطبية</h1>
            <p className="text-xs text-slate-500">نظام إدارة العيادات، الطابور والزيارات</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-900 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
        >
          <span>العودة للبوابة الرئيسية</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
          
          {/* Important Security Notice Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 mb-8 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-900 dark:text-amber-200 text-sm md:text-base">
                نظام مغلق ومحمي بالدعوات فقط (Invitation-Only)
              </h2>
              <p className="text-xs md:text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                {roleDetails.noticeAr}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Role Selection Column */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                اختر صفتك في المنظومة الصحية:
              </label>
              <div className="space-y-3">
                {CLINIC_ROUTING_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full text-right p-4 rounded-xl border transition-all ${
                      selectedRole === role.id
                        ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="font-semibold text-sm">{role.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {role.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  * ملاحظة أمنية: اختيار الدور هنا هو لأغراض التوجيه المؤسسي فقط ولا يمنح أي صلاحيات على النظام. الصلاحيات الطبية والإدارية تُمنح حصرًا عبر رابط الدعوة الصادر من إدارة العيادة.
                </p>
              </div>
            </div>

            {/* Login Only Form Column */}
            <div className="flex flex-col justify-between border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pr-8">
              <div>
                <h3 className="text-base font-bold mb-1">تسجيل الدخول لأعضاء الفريق</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  إذا تم تفعيل حسابك من خلال دعوة معتمدة، سجل دخولك أدناه
                </p>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      البريد الإلكتروني المعتمد بالدعوة
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@clinic.com"
                        className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors mt-2"
                  >
                    تسجيل الدخول
                  </button>

                  {/* Strictly NO signup button allowed here */}
                  <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
                    لا يوجد إنشاء حساب ذاتي. يتم إنشاء الحسابات عبر دعوات رسمية فقط.
                  </div>
                </form>
              </div>

              {/* Contact Us Section for Clinics */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">تريد تفعيل المنظومة لعيادتك؟</div>
                    <div className="text-xs text-slate-500">تواصل مع فريقنا لإنشاء حساب عيادة جديد</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 rounded-lg border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>تواصل معنا</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        منظومة Med الطبية · بوابة المؤسسات والعيادات الصحية · الدخول بالدعوات المعتمدة فقط
      </footer>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-2">طلب انضمام عيادة أو مركز طبي</h3>
            <p className="text-xs text-slate-500 mb-4">
              اترك بيانات عيادتك وسيقوم مسؤول المنصة بالتواصل معك لإنشاء حساب العيادة وإرسال الدعوة الإدارية.
            </p>

            {contactSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  تم استلام طلبك بنجاح
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  سيتواصل معك فريق المنصة خلال 24 ساعة عمل.
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">اسم العيادة أو المركز</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="عيادة الشروق التخصصية"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">رقم الهاتف / واتساب</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
                  >
                    إرسال الطلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
