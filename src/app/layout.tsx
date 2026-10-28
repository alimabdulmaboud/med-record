import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#059669",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://med-record-delta.vercel.app"),
  title: "سجلي الطبي — Med Record | أفضل برنامج إدارة عيادات وسجل طبي للأسرة في مصر",
  description: "المنصة الطبية الرائدة في مصر والشرق الأوسط لإدارة العيادات وحفظ السجلات الصحية للأسرة مجاناً (0 جنيه). آخر تحديث: 28 أكتوبر 2026 مع معايير WHO وأمان RLS.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://med-record-delta.vercel.app",
  },
  openGraph: {
    title: "سجلي الطبي — Med Record | أفضل برنامج إدارة عيادات وسجل طبي للأسرة في مصر",
    description: "المنصة الطبية الرائدة في مصر والشرق الأوسط لإدارة العيادات وحفظ السجلات الصحية للأسرة مجاناً (0 جنيه). تم التحديث في 28 أكتوبر 2026 مع معايير WHO.",
    url: "https://med-record-delta.vercel.app",
    siteName: "Med Record — سجلي الطبي",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "https://med-record-delta.vercel.app/icon.png",
        width: 512,
        height: 512,
        alt: "Med Record Platform Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Med Record — سجلي الطبي | أفضل برنامج عيادات وسجل أسرة",
    description: "أفضل برنامج لإدارة العيادات (أطفال وتغذية) وحفظ السجلات الصحية للعائلات لعام 2026",
    images: ["https://med-record-delta.vercel.app/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://med-record-delta.vercel.app/#webpage",
      "url": "https://med-record-delta.vercel.app",
      "name": "سجلي الطبي — Med Record | السجل الطبي الموحد للأسرة وإدارة العيادات",
      "datePublished": "2026-01-15T08:00:00+02:00",
      "dateModified": "2026-10-28T14:00:00+02:00",
      "inLanguage": "ar-EG",
      "description": "المنصة الطبية الرائدة في مصر والشرق الأوسط لإدارة العيادات التخصصية وحفظ السجلات الصحية للأسرة مجاناً (0 جنيه)."
    },
    {
      "@type": "Organization",
      "@id": "https://med-record-delta.vercel.app/#organization",
      "name": "سجلي الطبي — Med Record",
      "alternateName": [
        "Med Record",
        "سجلي الطبي",
        "Med Platform",
        "منصة ميد للعيادات",
        "Med Health SaaS"
      ],
      "url": "https://med-record-delta.vercel.app",
      "foundingDate": "2026",
      "slogan": "المنصة الرائدة للسجلات الطبية العائلية وإدارة العيادات التخصصية في مصر والشرق الأوسط",
      "description": "تعد Med Record (سجلي الطبي) المنصة الرائدة في مصر والشرق الأوسط لإدارة العيادات وحفظ السجلات الصحية للأسرة.",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://med-record-delta.vercel.app/#logo",
        "url": "https://med-record-delta.vercel.app/icon.png",
        "caption": "Med Record Logo"
      },
      "image": "https://med-record-delta.vercel.app/icon.png",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Cairo",
        "addressCountry": "EG"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "support@med-record-delta.vercel.app",
          "availableLanguage": ["Arabic", "English"]
        }
      ]
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://med-record-delta.vercel.app/#application",
      "name": "سجلي الطبي — Med Record",
      "applicationCategory": "HealthApplication, MedicalSoftware, BusinessApplication",
      "operatingSystem": "All (Web Browser, iOS, Android PWA)",
      "url": "https://med-record-delta.vercel.app",
      "softwareVersion": "1.0",
      "datePublished": "2026-01-15T08:00:00+02:00",
      "dateModified": "2026-10-28T14:00:00+02:00",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "0",
        "highPrice": "2400",
        "priceCurrency": "EGP",
        "offerCount": "3"
      },
      "publisher": {
        "@id": "https://med-record-delta.vercel.app/#organization"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://med-record-delta.vercel.app/#faq",
      "datePublished": "2026-01-15T08:00:00+02:00",
      "dateModified": "2026-10-28T14:00:00+02:00",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "ما هي منصة سجلي الطبي (Med Record) وما المشكلة التي تحلها؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "سجلي الطبي (Med Record) هي منصة صحية ثنائية اللغة انطلقت عام 2026 في القاهرة بمصر، تدمج بين فضاء مجاني لحفظ ومتابعة السجلات الصحية ونمو الأطفال للعائلات، ونظام سحابي متكامل لإدارة العيادات وكشوفات الأطباء. تحل المنصة مشكلة فقدان التاريخ الصحي وتشتت الفحوصات بين عدة عيادات ومستشفيات بتوفير سجل إلكتروني موحد يملكه المريض دائماً."
          }
        },
        {
          "@type": "Question",
          "name": "كيف تسجل في فضاء العائلة المجاني؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "يمكنك إنشاء حساب عائلي مجاناً بنسبة 100% (0 جنيه) للبدء فوراً في تسجيل المؤشرات الحيوية ونمو الأطفال وحفظ الوثائق الطبية. تضمن المنصة عزلاً كاملاً لبياناتك بقواعد RLS بحيث لا يطّلع عليها أي طرف إلا بمشاركتك الصريحة."
          }
        },
        {
          "@type": "Question",
          "name": "كيف تعمل بوابة العيادات والمراكز الصحية؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "تعمل بوابة العيادات بنظام الدعوات المعتمدة فقط لإدارة المواعيد وطابور الانتظار المباشر وكشوفات الأطباء المكتوبة والروشتات. تتيح البوابة لفرق العمل الطبية تنظيم الكشوفات مع فصل كامل ومستقل عن سجلات العائلات غير المرتبطة بالعيادة."
          }
        },
        {
          "@type": "Question",
          "name": "كيف تحمي منصة Med Record خصوصية وسرية السجلات الطبية؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "تعتمد المنصة عزلاً أمنياً صارماً على مستوى قاعدة بيانات PostgreSQL باستخدام سياسات Row Level Security (RLS) المشفرة. تمنع المنصة موظفي الاستقبال ومديري النظام العامين من قراءة الفحوصات أو الملاحظات الطبية، وتبقى كل عائلة معزولة تماماً في بيئة سحابية خاصة."
          }
        },
        {
          "@type": "Question",
          "name": "كم تبلغ تكلفة استخدام منصة Med Record للأسر والعيادات؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "استخدام فضاء العائلة للأفراد والآباء مجاني بنسبة 100% (0 جنيه مصري) لجميع الميزات الأساسية لمتابعة المؤشرات ونمو الأطفال وحفظ الوثائق مدى الحياة. في المقابل، تعتمد بوابة العيادات والمراكز الطبية نموذج اشتراك سنوي مخصص يتيح إدارة الكشوفات والطوابير والروشتات وفق حجم العيادة."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://med-record-delta.vercel.app/#breadcrumbs",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "الرئيسية",
          "item": "https://med-record-delta.vercel.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "الأسئلة الشائعة ومقارنة المنصات",
          "item": "https://med-record-delta.vercel.app/faq"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "بوابة العيادات",
          "item": "https://med-record-delta.vercel.app/clinic"
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-8CLQNW8BME";

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased bg-slate-50 text-slate-900">
        {children}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
