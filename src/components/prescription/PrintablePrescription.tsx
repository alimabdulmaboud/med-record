"use client";

import React from "react";
import { PrescriptionItem } from "@/lib/clinical/types";
import { DoctorLetterhead } from "@/lib/settings/schema";
import { Stethoscope, Phone, MapPin, Calendar, User, Clock, FileText } from "lucide-react";

export interface PrescriptionPrintProps {
  paperSize: "A4" | "A5";
  letterhead: {
    clinicName: string;
    doctorName: string;
    title: string;
    specialty: string;
    phone: string;
    address: string;
    logoUrl?: string | null;
  };
  patient: {
    name: string;
    age?: string | number;
    gender?: string;
    patientId: string;
  };
  visitDate: string;
  diagnosis?: string;
  items: Omit<PrescriptionItem, "id">[];
  advice?: string;
  followUpDate?: string;
  isReprint?: boolean;
}

export function PrintablePrescription({
  paperSize,
  letterhead,
  patient,
  visitDate,
  diagnosis,
  items,
  advice,
  followUpDate,
  isReprint = false,
}: PrescriptionPrintProps) {
  const isA5 = paperSize === "A5";

  return (
    <div
      className={`prescription-print-container mx-auto bg-white text-slate-900 border border-slate-300 shadow-sm print:border-none print:shadow-none print:m-0 ${
        isA5
          ? "w-[148mm] min-h-[210mm] p-[8mm] text-[11px]"
          : "w-[210mm] min-h-[297mm] p-[14mm] text-[13px]"
      }`}
      dir="rtl"
      style={{
        boxSizing: "border-box",
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
      }}
    >
      {/* Dynamic Print CSS for Page Sizing and Zero-Margin Print */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${isA5 ? "A5 portrait" : "A4 portrait"};
            margin: ${isA5 ? "6mm 8mm" : "10mm 12mm"};
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide non-printable app elements */
          header, nav, aside, button, .no-print {
            display: none !important;
          }
          .prescription-print-container {
            width: 100% !important;
            min-height: auto !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* 1. CLINIC LETTERHEAD (ترويسة العيادة الرسمية) */}
      <header className="pb-4 border-b-2 border-slate-800">
        <div className="flex items-center justify-between gap-4">
          {/* Doctor Info (Right) */}
          <div className="text-right flex-1">
            <h1 className={`${isA5 ? "text-base" : "text-xl"} font-black text-slate-900 tracking-tight`}>
              {letterhead.doctorName}
            </h1>
            <p className={`${isA5 ? "text-[10px]" : "text-xs"} font-bold text-blue-800 mt-0.5`}>
              {letterhead.title} — {letterhead.specialty}
            </p>
            <p className={`${isA5 ? "text-[9px]" : "text-[11px]"} text-slate-600 mt-0.5`}>
              عضو الجمعية المصرية لطب الأطفال • دكتوراه طب الأطفال
            </p>
          </div>

          {/* Clinic Emblem / Logo (Center) */}
          <div className="text-center px-3">
            <div className={`mx-auto rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center ${
              isA5 ? "w-10 h-10" : "w-14 h-14"
            }`}>
              <Stethoscope className={isA5 ? "w-5 h-5" : "w-7 h-7"} />
            </div>
            <span className={`${isA5 ? "text-[10px]" : "text-xs"} font-extrabold text-slate-800 block mt-1`}>
              {letterhead.clinicName}
            </span>
          </div>

          {/* Contact & Address (Left) */}
          <div className="text-left flex-1 space-y-0.5 text-slate-600">
            <p className={`flex items-center justify-end gap-1.5 ${isA5 ? "text-[9px]" : "text-xs"}`}>
              <span dir="ltr">{letterhead.phone}</span>
              <Phone className="w-3 h-3 text-slate-400" />
            </p>
            <p className={`flex items-center justify-end gap-1.5 ${isA5 ? "text-[9px]" : "text-xs"}`}>
              <span>{letterhead.address}</span>
              <MapPin className="w-3 h-3 text-slate-400" />
            </p>
            {isReprint && (
              <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                نسخة معادة (Reprint)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. PATIENT DEMOGRAPHICS BAR (بيانات المريض) */}
      <section className="my-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
        <div className="grid grid-cols-4 gap-2 text-slate-800">
          <div>
            <span className="text-slate-500 block text-[10px]">اسم المريض:</span>
            <span className="font-bold">{patient.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">السن / النوع:</span>
            <span className="font-semibold">{patient.age || "—"} • {patient.gender || "طفل"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">تاريخ الكشف:</span>
            <span className="font-semibold" dir="ltr">
              {new Date(visitDate).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="text-left">
            <span className="text-slate-500 block text-[10px]">رقم الملف الطبي:</span>
            <span className="font-mono font-bold text-slate-700">{patient.patientId}</span>
          </div>
        </div>

        {diagnosis && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px]">
            <span className="text-slate-500 font-medium">التشخيص الطبي: </span>
            <span className="font-bold text-slate-900">{diagnosis}</span>
          </div>
        )}
      </section>

      {/* 3. RX MEDICAL SYMBOL & PRESCRIPTION ITEMS */}
      <main className="my-4 min-h-[90mm]">
        {/* Rx Symbol */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-serif italic font-black text-2xl text-blue-900 leading-none">
            ℞
          </span>
          <div className="h-0.5 flex-1 bg-slate-200" />
        </div>

        {/* Prescription Items List */}
        <div className="space-y-3.5 pr-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="pb-3 border-b border-dashed border-slate-200 last:border-none"
            >
              {/* Medication Name & Dose */}
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-950 text-sm">
                    {idx + 1}. {item.medicationName}
                  </span>
                  {item.dose && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                      {item.dose}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  {item.frequency} {item.duration ? `— لمدة ${item.duration}` : ""}
                </div>
              </div>

              {/* Instructions (Verbatim Doctor Text - Rule #8) */}
              {item.instructions && (
                <p className="text-[11px] text-slate-600 mt-1 pr-4 font-medium">
                  • {item.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* 4. ADVICE & RECOMMENDATIONS BOX */}
      {advice && advice.trim() !== "" && (
        <section className="my-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
          <h4 className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-500" />
            إرشادات وتعليمات الطبيب:
          </h4>
          <p className="text-[11px] text-slate-800 leading-relaxed font-medium pr-1">
            {advice}
          </p>
        </section>
      )}

      {/* 5. FOLLOW-UP DATE & STAMP SECTION */}
      <footer className="mt-auto pt-3 border-t-2 border-slate-800">
        <div className="flex items-end justify-between gap-4">
          {/* Next Visit Date */}
          <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-200 text-right">
            <span className="text-[10px] text-blue-800 block font-bold">موعد الاستشارة والمتابعة القادمة:</span>
            <span className="font-bold text-slate-900 text-xs">
              {followUpDate
                ? new Date(followUpDate).toLocaleDateString("ar-EG", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "بعد أسبوع من تاريخه"}
            </span>
          </div>

          {/* Signature & Stamp Placeholder */}
          <div className="text-center w-36">
            <div className="h-10 border-b border-dotted border-slate-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-600 block">
              توقيع الطبيب المعالج
            </span>
          </div>
        </div>

        {/* Bottom Contact Reminder */}
        <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500">
          يرجى إحضار هذه الروشتة في الاستشارة • نتمنى لكم الشفاء العاجل ودوام الصحة والعافية
        </div>
      </footer>
    </div>
  );
}
