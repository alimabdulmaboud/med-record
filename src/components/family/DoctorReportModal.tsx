"use client";

import React, { useState } from 'react';
import type { Person } from '@/types/family';
import type {
  ReportSectionId,
  CreateDoctorReportInput,
  DoctorReportEntity,
} from '@/types/reports';
import { ALL_REPORT_SECTIONS } from '@/lib/family/reports-service';
import {
  FileText,
  X,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface DoctorReportModalProps {
  isOpen: boolean;
  person: Person;
  onClose: () => void;
  onGenerateReport: (input: CreateDoctorReportInput) => Promise<DoctorReportEntity>;
  onReportCreated?: (report: DoctorReportEntity) => void;
}

type DatePreset = '30d' | '90d' | '1y' | 'all' | 'custom';

export function DoctorReportModal({
  isOpen,
  person,
  onClose,
  onGenerateReport,
  onReportCreated,
}: DoctorReportModalProps) {
  const [preset, setPreset] = useState<DatePreset>('90d');
  const todayStr = new Date().toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(todayStr);

  const [title, setTitle] = useState(
    person.is_child
      ? `تقرير طبي موجز لطبيب الأطفال - ${person.name}`
      : `تقرير طبي موجز للطبيب - ${person.name}`
  );

  const [summaryNotes, setSummaryNotes] = useState('');
  const [selectedSections, setSelectedSections] = useState<ReportSectionId[]>(() => {
    if (person.is_child) {
      return ['vitals', 'growth', 'medications', 'allergies', 'labs', 'visits', 'vaccinations'];
    }
    return ['vitals', 'medications', 'allergies', 'labs', 'visits'];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (p: DatePreset) => {
    setPreset(p);
    const d = new Date();
    if (p === '30d') {
      d.setDate(d.getDate() - 30);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (p === '90d') {
      d.setDate(d.getDate() - 90);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (p === '1y') {
      d.setFullYear(d.getFullYear() - 1);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (p === 'all') {
      setDateFrom('2020-01-01');
      setDateTo(todayStr);
    }
  };

  const toggleSection = (sectionId: ReportSectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const report = await onGenerateReport({
        family_id: person.family_id,
        person_id: person.id,
        title: title.trim() || `تقرير طبي - ${person.name}`,
        date_range_from: dateFrom,
        date_range_to: dateTo,
        included_sections: selectedSections,
        summary_notes: summaryNotes.trim() || undefined,
      });

      if (onReportCreated) {
        onReportCreated(report);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50"
      dir="rtl"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">
              إنشاء تقرير طبي موجز (A4 / IPS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              عنوان التقرير الطبي:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date range presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              الفترة الزمنية للبيانات السريرية:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { id: '30d', label: 'آخر شهر' },
                { id: '90d', label: 'آخر 3 شهور' },
                { id: '1y', label: 'آخر سنة' },
                { id: 'all', label: 'كل السجل' },
                { id: 'custom', label: 'فترة مخصصة' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleApplyPreset(item.id as DatePreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    preset === item.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPreset('custom');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Sections inclusion */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              الأقسام المتضمنة في التقرير:
            </label>
            <div className="space-y-1.5">
              {ALL_REPORT_SECTIONS.map((sec) => {
                const isSelected = selectedSections.includes(sec.id);
                // Hide growth or vaccinations if not child and no relevant data
                if (sec.id === 'growth' && !person.is_child) return null;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                      <span>{sec.labelAr}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{sec.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ملاحظات إضافية للطبيب (اختياري):
            </label>
            <textarea
              rows={2}
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="مثال: يرجى التركيز على متابعة قراءات السكر وضغط الدم الصباحية..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || selectedSections.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ تجميع ومعالجة التقرير...' : 'توليد ومعاينة التقرير الطبي'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
