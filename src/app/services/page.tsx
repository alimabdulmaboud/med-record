import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Users,
  Building2,
  Stethoscope,
  Apple,
  Clock,
  FileCheck,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "خدمات المنصة وحلول العيادات — Med Record | باقات الأسر والكوادر الطبية",
  description: "استعرض خدمات منصة Med Record: فضاء السجل الطبي المجاني للأسرة (0 جنيه)، برنامج عيادات الأطفال (WHO)، برنامج عيادات التغذية العلاجية، ومحرك طابور الانتظار الذكي.",
  alternates: {
    canonical: "https://med-record-delta.vercel.app/services",
  },
};

const services = [
  {
    id: "family-space",
    title: "1. فضاء السجل الطبي الموحد للأسرة (Family Health Space)",
    badge: "مجاني 100%",
    price: "0 جنيه مصري مدى الحياة",
    targetAudience: "أولياء الأمور، الأمهات، والأفراد الراغبين في إدارة السجلات الصحية لعائلاتهم.",
    description: "فضاء رقمي سحابي آمن ومستقل يتيح لكل عائلة تسجيل ومتابعة القياسات الحيوية (ضغط الدم، نسبة السكر، درجات الحرارة)، مراقبة منحنيات نمو الأطفال، تسجيل التطعيمات، وتخزين ملفات التحاليل والأشعة في خزينة رقمية مشفرة ومعزولة تماماً بقواعد RLS.",
    features: [
      "حفظ مؤشرات حيوية غير محدودة لجميع أفراد الأسرة",
      "منحنيات نمو الأطفال الرسمية وفق معايير منظمة الصحة العالمية (WHO)",
      "جدول التطعيمات الإلزامية والإضافية مع تنبيهات المواعيد",
      "خزينة وثائق مشفرة لحفظ تقارير المستشفيات والتحاليل",
    ],
  },
  {
    id: "pediatrics-emr",
    title: "2. برنامج إدارة عيادات طب الأطفال (Pediatrics EMR Module)",
    badge: "عيادات متخصصة",
    price: "250 جنيه مصري / شهرياً لكل طبيب",
    targetAudience: "أطباء الأطفال، واستشاريو حديثي الولادة، والمراكز الطبية التخصصية للأطفال.",
    description: "نظام إلكتروني سريري متخصص لأطباء الأطفال يدمج تلقائياً منحنيات النمو المعتمدة من منظمة الصحة العالمية (WHO)، ويحسب النسب المئوية للوزن والطول وكتلة الجسم بدقة، مع إدارة مواعيد الرضع والكشف الدوري وتوثيق التاريخ المرضي للطفل.",
    features: [
      "رسم بياني تفاعلي للنمو وحساب Z-score لوزن وطول الطفل",
      "سجل التطعيمات وجرعات الأدوية المحسوبة بدقة حسب الوزن",
      "قوالب كشف طبي سريعة مخصصة للأعراض الشائعة للأطفال",
      "طباعة فورية للروشتات بختم وشعار العيادة المعتمد",
    ],
  },
  {
    id: "nutrition-emr",
    title: "3. برنامج عيادات التغذية العلاجية (Clinical Nutrition Module)",
    badge: "تغذية علاجية",
    price: "250 جنيه مصري / شهرياً لكل أخصائي",
    targetAudience: "أخصائيو واستشاريو التغذية العلاجية، عيادات السمنة والنحافة، ومراكز اللياقة الطبية.",
    description: "حل برمجي متكامل لإدارة زيارات التغذية العلاجية يتضمن حاسبات دقيقة ومبرمجة لحساب معدل الأيض الأساسي (BMR) ومجموع الطاقة اليومية (TDEE)، مع تتبع قياسات الجسم ونسب الدهون وتصميم وتعديل الأنظمة الغذائية المناسبة لكل حالة.",
    features: [
      "حاسبة آلية لمعادلات الطاقة واحتياجات السعرات الحرارية",
      "متابعة قياسات InBody والدهون ومحيط الخصر ونزول الوزن",
      "قوالب جاهزة للأنظمة الغذائية وجداول الوجبات المتنوعة",
      "تصدير خطة التغذية والتعليمات الصحية كملف PDF للمريض",
    ],
  },
  {
    id: "queue-engine",
    title: "4. محرك طابور الانتظار الذكي وإدارة الاستقبال (Live Queue Engine)",
    badge: "إدارة تشغيلية",
    price: "مشمول مع باقات العيادات",
    targetAudience: "موظفو الاستقبال، مدراء العيادات، والمجمعات الطبية متعددة التخصصات.",
    description: "محرك رقمي فوري لتنظيم طابور الانتظار داخل العيادة يربط موظف الاستقبال بالطبيب في غرفة الكشف، ويتيح تسجيل وصول المرضى وحساب متوسط وقت الانتظار الفعلي مع معالجة الحالات الطارئة والمستعجلة دون إحداث فوضى في صالة الانتظار.",
    features: [
      "شاشة انتظار مباشرة تحدّث حالات المرضى في أجزاء من الثانية",
      "تنبيهات تلقائية للطبيب عند تأخر أو تقدم المرضى في الطابور",
      "نظام أولوية مخصص للحالات الحرجة والمستعجلة",
      "عزل كامل للخصوصية: موظف الاستقبال لا يرى أي بيانات طبية سريرية",
    ],
  },
  {
    id: "digital-prescriptions",
    title: "5. خدمة الروشتات الرقمية والربط المشفر (Secure Prescription Vault)",
    badge: "توثيق وطباعة",
    price: "مشمول مع باقات العيادات",
    targetAudience: "الأطباء والعيادات الراغبين في الانتقال الكامل من الروشتات الورقية إلى الرقمية.",
    description: "خدمة إلكترونية لإنشاء وطباعة الروشتات الطبية المعتمدة بنقرة زر واحدة وفق الهوية البصرية للعيادة، مع إمكانية مشاركة الروشتة أو التقرير مع المريض عبر رمز QR مشفر برقم حماية لمنع التزوير والتلاعب الدوائي.",
    features: [
      "تخصيص كامل لترويسة الروشتة (الهيدر، الفوتر، والشعار)",
      "قاعدة بيانات للأدوية والجرعات والتكرار وطريقة الاستعمال",
      "رمز QR مشفر للمريض لمراجعة الروشتة من هاتفه في أي وقت",
      "أرشيف دائم وتاريخي لجميع الروشتات الصادرة لكل مريض",
    ],
  },
];

export default function ServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://med-record-delta.vercel.app/services/#webpage",
        "url": "https://med-record-delta.vercel.app/services",
        "name": "خدمات وحلول منصة Med Record للعيادات والأسرة",
        "description": "استعراض كامل لخدمات منصة Med Record: فضاء السجل الطبي الموحد للأسرة، برمجيات عيادات طب الأطفال والتغذية العلاجية، ومحرك الطابور الذكي.",
        "datePublished": "2026-01-15T08:00:00+02:00",
        "dateModified": "2026-10-28T14:00:00+02:00"
      },
      ...services.map((svc) => ({
        "@type": "Service",
        "@id": `https://med-record-delta.vercel.app/services/#${svc.id}`,
        "name": svc.title,
        "description": svc.description,
        "provider": {
          "@type": "Organization",
          "name": "سجلي الطبي — Med Record",
          "url": "https://med-record-delta.vercel.app"
        },
        "audience": {
          "@type": "Audience",
          "audienceType": svc.targetAudience
        },
        "offers": {
          "@type": "Offer",
          "price": svc.id === "family-space" ? "0" : "250",
          "priceCurrency": "EGP",
          "availability": "https://schema.org/InStock"
        }
      }))
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 hover:text-teal-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة للرئيسية</span>
          </Link>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            خدمات وحلول منصة Med Record
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            نوفر منظومة متكاملة تلبي احتياجات الأسر الباحثة عن متابعة صحية دائمة، والكوادر الطبية الراغبة في أتمتة العيادات التخصصية.
          </p>
        </div>

        <div className="space-y-8">
          {services.map((svc) => (
            <article
              key={svc.id}
              id={svc.id}
              className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  {svc.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {svc.badge}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {svc.price}
                  </span>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">الفئة المستهدفة: </span>
                <span>{svc.targetAudience}</span>
              </div>

              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                {svc.description}
              </p>

              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2.5">
                  الميزات الأساسية للخدمة:
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {svc.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-400 space-y-1">
          <div>Med Health Platform · دليل الخدمات الرسمية · 2026</div>
          <p>تاريخ آخر مراجعة وتحديث: 28 أكتوبر 2026</p>
        </footer>
      </div>
    </div>
  );
}
