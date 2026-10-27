"use client";

import React, { useState, useMemo } from 'react';
import type {
  FamilyMember,
  Measurement,
  Medication,
  Encounter,
  MedicalDocument,
  DoctorReport,
} from '@/types/med-record';
import {
  compileDoctorReportData,
  REPORT_SECTIONS,
} from '@/lib/med-record/report-compiler';
import { DoctorReportPrintView } from './DoctorReportPrintView';
import { ShareModal } from './ShareModal';
import {
  FileText,
  Calendar,
  CheckSquare,
  Square,
  Activity,
  Pill,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  Share2,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface DoctorReportBuilderProps {
  member: FamilyMember;
  members: FamilyMember[];
  onSelectMember: (memberId: string) => void;
  measurements: Measurement[];
  medications: Medication[];
  encounters: Encounter[];
  documents: MedicalDocument[];
  onSaveReport?: (reportData: {
    memberId: string;
    title: string;
    dateFrom: string;
    dateTo: string;
    includedSections: string[];
    summaryNotes?: string;
  }) => Promise<DoctorReport>;
  onCreateShare?: (
    reportId: string,
    hours: number,
    pin?: string
  ) => Promise<{ accessToken: string; expiresAt: string }>;
  onRevokeShare?: (token: string) => Promise<void>;
}

type DatePreset = '30d' | '90d' | '1y' | 'all' | 'custom';

export function DoctorReportBuilder({
  member,
  members,
  onSelectMember,
  measurements,
  medications,
  encounters,
  documents,
  onSaveReport,
  onCreateShare,
  onRevokeShare,
}: DoctorReportBuilderProps) {
  // Date range presets
  const [preset, setPreset] = useState<DatePreset>('90d');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(todayStr);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const d = new Date();
    if (newPreset === '30d') {
      d.setDate(d.getDate() - 30);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (newPreset === '90d') {
      d.setDate(d.getDate() - 90);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (newPreset === '1y') {
      d.setFullYear(d.getFullYear() - 1);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (newPreset === 'all') {
      setDateFrom('2020-01-01');
      setDateTo(todayStr);
    }
  };

  // Included sections
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'vitals',
    'medications',
    'allergies',
    'labs',
    'visits',
  ]);

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Notes
  const [summaryNotes, setSummaryNotes] = useState(
    'متابعة دورية لحالة المريض ومراجعة ضغط الدم ومعدل السكر والفحوصات الأخيرة.'
  );

  // Sharing state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeReportId, setActiveReportId] = useState<string>('rep-active');

  // Compile report data reactively
  const compiledReport = useMemo(() => {
    return compileDoctorReportData({
      member,
      dateRange: { from: dateFrom, to: dateTo },
      includedSections: selectedSections,
      measurements,
      medications,
      encounters,
      documents,
      summaryNotes: summaryNotes.trim() || undefined,
    });
  }, [
    member,
    dateFrom,
    dateTo,
    selectedSections,
    measurements,
    medications,
    encounters,
    documents,
    summaryNotes,
  ]);

  const handleShareClick = async () => {
    if (onSaveReport) {
      const saved = await onSaveReport({
        memberId: member.id,
        title: compiledReport.title,
        dateFrom,
        dateTo,
        includedSections: selectedSections,
        summaryNotes: summaryNotes.trim() || undefined,
      });
      setActiveReportId(saved.id);
    }
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Configuration Panel (Hidden in Print) */}
      <div className="print:hidden bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                مُنشئ تقرير الطبيب المعتمد (1-2 صفحة)
              </h2>
              <p className="text-xs text-slate-500">
                اختر الفترة والأقسام المراد تصديرها للطبيب بملف A4 أو رابط مؤمن
              </p>
            </div>
          </div>

          {/* Member Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">الملف الشخصي:</span>
            <select
              value={member.id}
              onChange={e => onSelectMember(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.relationship === 'self' ? 'أنا' : m.relationship})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>نطاق تاريخ الفحوصات والقياسات:</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePresetChange('30d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === '30d'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => handlePresetChange('90d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === '90d'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              آخر 3 أشهر (الموصى بها)
            </button>
            <button
              onClick={() => handlePresetChange('1y')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === '1y'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              آخر سنة
            </button>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              السجل الكامل
            </button>
            <button
              onClick={() => handlePresetChange('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              تاريخ مخصص
            </button>
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-3 pt-2">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">من تاريخ:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">إلى تاريخ:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section Checkboxes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>الأقسام المضمنة في التقرير:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {REPORT_SECTIONS.map(sec => {
              const checked = selectedSections.includes(sec.id);
              return (
                <button
                  key={sec.id}
                  onClick={() => toggleSection(sec.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    checked
                      ? 'border-emerald-500/50 bg-emerald-50/40 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 font-medium'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div className="text-xs">
                    <div>{sec.labelAr}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{sec.labelEn}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Doctor Summary Notes / Chief Complaint */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            ملاحظات الطبيب المعالج / سبب الزيارة (Chief Complaint / Notes):
          </label>
          <textarea
            rows={2}
            value={summaryNotes}
            onChange={e => setSummaryNotes(e.target.value)}
            placeholder="اكتب أي ملاحظة أو شكوى محددة تريد لفت انتباه الطبيب إليها..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-emerald-600"
          />
        </div>
      </div>

      {/* Live A4 Print and Share View */}
      <DoctorReportPrintView
        report={compiledReport}
        onPrint={() => window.print()}
        onShare={handleShareClick}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        reportId={activeReportId}
        memberName={member.fullName}
        onClose={() => setIsShareModalOpen(false)}
        onCreateShare={
          onCreateShare ||
          (async (repId, hours, pin) => {
            // Fallback mockup generator if not provided
            const token = Math.random().toString(36).substring(2, 12);
            const exp = new Date(Date.now() + hours * 3600 * 1000).toISOString();
            return { accessToken: token, expiresAt: exp };
          })
        }
        onRevokeShare={onRevokeShare}
      />
    </div>
  );
}
