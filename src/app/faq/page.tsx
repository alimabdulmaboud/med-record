import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, HelpCircle, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة — Med Record | كل ما تحتاج معرفته عن المنصة",
  description: "إجابات مباشرة ومفصلة حول منصة Med Record: تكلفة فضاء العائلة (0 جنيه)، آلية عمل بوابة العيادات، وأمان وتشفير السجلات الطبية وفق معايير RLS. تاريخ آخر تحديث: 28 أكتوبر 2026.",
  alternates: {
    canonical: "https://med-record-delta.vercel.app/faq",
  },
};

const faqData = [
  {
    q: "ما هي منصة سجلي الطبي (Med Record) وما المشكلة التي تحلها؟",
    a: "سجلي الطبي (Med Record) هي منصة صحية ثنائية اللغة انطلقت عام 2026 في القاهرة بمصر، تدمج بين فضاء مجاني لحفظ ومتابعة السجلات الصحية ونمو الأطفال للعائلات، ونظام سحابي متكامل لإدارة العيادات وكشوفات الأطباء. تحل المنصة مشكلة فقدان التاريخ الصحي وتشتت الفحوصات بين عدة عيادات ومستشفيات بتوفير سجل إلكتروني موحد يملكه المريض دائماً.",
  },
  {
    q: "كم تبلغ تكلفة استخدام منصة Med Record للأسر والعيادات؟",
    a: "استخدام فضاء العائلة للأفراد والآباء مجاني بنسبة 100% (0 جنيه مصري) لجميع الميزات الأساسية لمتابعة المؤشرات ونمو الأطفال وحفظ الوثائق مدى الحياة. في المقابل، تعتمد بوابة العيادات والمراكز الطبية نموذج اشتراك سنوي مخصص يتيح إدارة الكشوفات والطوابير والروشتات وفق حجم العيادة.",
  },
  {
    q: "كيف تحمي منصة Med Record خصوصية وسرية السجلات الطبية؟",
    a: "تعتمد المنصة عزلاً أمنياً صارماً على مستوى قاعدة بيانات PostgreSQL باستخدام سياسات Row Level Security (RLS) المشفرة. تمنع المنصة موظفي الاستقبال ومديري النظام العامين من قراءة الفحوصات أو الملاحظات الطبية، وتبقى كل عائلة معزولة تماماً في بيئة سحابية خاصة.",
  },
  {
    q: "كيف تنضم العيادات والمراكز الطبية إلى بوابة Med Clinic؟",
    a: "تنضم العيادات والمراكز الطبية إلى منظومة Med حصرياً عبر نظام الدعوات المعتمدة لضمان التحقق من الكوادر الطبية والمؤسسات المرخصة. توفر البوابة لإدارة العيادات والأطباء نظام طابور انتظار حي، كشوفات تخصصية (مثل طب الأطفال والتغذية العلاجية)، وطباعة فورية للروشتات والتقارير.",
  },
  {
    q: "ما هي المعايير الطبية المعتمدة لمتابعة نمو الأطفال؟",
    a: "تعتمد منصة Med Record المنحنيات والمعايير المعتمدة رسمياً من منظمة الصحة العالمية (WHO Child Growth Standards) لحساب النسب المئوية للوزن والطول ومؤشر كتلة الجسم للأطفال. تتيح هذه الرسوم البيانية لأطباء الأطفال وأولياء الأمور رصد أي تباطؤ أو انحراف في نمو الطفل مبكراً وبدقة رقمية عالية.",
  },
  {
    q: "هل يمكن للمريض مشاركة سجله الطبي بأمان مع طبيب أو استشاري خارجي؟",
    a: "نعم، تتيح المنصة خاصية المشاركة الآمنة المؤقتة عبر رابط مشفر أو رمز QR مع رقم سري ينتهي تلقائياً بعد فترة محددة، مما يسمح للطبيب المعالج بالاطلاع على الفحوصات والتحاليل دون الحاجة لإرسالها عبر تطبيقات غير مخصصة للبيانات الطبية.",
  },
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "datePublished": "2026-01-15T08:00:00+02:00",
    "dateModified": "2026-10-28T14:00:00+02:00",
    "mainEntity": faqData.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 hover:text-teal-700 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>العودة للرئيسية</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              الأسئلة الشائعة حول منصة Med Record
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>تاريخ آخر تحديث:</span>
              <time dateTime="2026-10-28" className="font-semibold text-slate-700 dark:text-slate-300">
                28 أكتوبر 2026
              </time>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {faqData.map((item, index) => (
            <article
              key={index}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
            >
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <span>{item.q}</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pr-7">
                {item.a}
              </p>
            </article>
          ))}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-400 space-y-1">
          <div>Med Health Platform · أسئلة وأجوبة معتمدة · 2026</div>
          <div>
            <span>تاريخ آخر مراجعة: </span>
            <time dateTime="2026-10-28">28 أكتوبر 2026</time>
          </div>
        </footer>
      </div>
    </div>
  );
}
