"use client";

import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  X,
  AlertCircle,
  Bell,
  BellOff,
} from 'lucide-react';
import type { Medication, MedicationStatus } from '@/types/med-record';
import { formatMedicationSchedule } from '@/lib/med-record/medications-visits-helper';

interface MedicationsManagerProps {
  memberId: string;
  memberName: string;
  medications: Medication[];
  onAddMedication: (med: Omit<Medication, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStatus: (id: string, status: MedicationStatus) => Promise<void>;
}

export function MedicationsManager({
  memberId,
  memberName,
  medications,
  onAddMedication,
  onUpdateStatus,
}: MedicationsManagerProps) {
  const [filterStatus, setFilterStatus] = useState<MedicationStatus | 'all'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Medication Form State
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('مرة واحدة يومياً');
  const [timingNotes, setTimingNotes] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredMeds = medications.filter(
    m => filterStatus === 'all' || m.status === filterStatus
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dose || !frequency) {
      setErrorMsg('يرجى ملء اسم الدواء والجرعة ومعدل التكرار');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await onAddMedication({
        memberId,
        name,
        dose,
        frequency,
        timingNotes: timingNotes.trim() || undefined,
        startDate,
        endDate: endDate ? endDate : undefined,
        status: 'active',
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
      });

      // Reset
      setName('');
      setDose('');
      setTimingNotes('');
      setEndDate('');
      setIsModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الدواء');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'active', label: 'الأدوية الحالية المستمرة', count: medications.filter(m => m.status === 'active').length },
            { id: 'paused', label: 'موقوفة مؤقتاً', count: medications.filter(m => m.status === 'paused').length },
            { id: 'completed', label: 'أدوية سابقة منتهية', count: medications.filter(m => m.status === 'completed').length },
            { id: 'all', label: 'الكل', count: medications.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-80 mr-1.5">({tab.count})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دواء جديد</span>
        </button>
      </div>

      {/* Medication Cards List */}
      {filteredMeds.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد أدوية في هذا القسم</h4>
          <p className="text-xs text-slate-400">انقر على زر "إضافة دواء جديد" لإدراج جرعة وعلاج جديد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeds.map(med => {
            const formatted = formatMedicationSchedule(med);

            return (
              <div
                key={med.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {med.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          بدأ في: {med.startDate}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        med.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : med.status === 'paused'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {med.status === 'active' ? 'مستمر' : med.status === 'paused' ? 'موقوف مؤقتاً' : 'منتهي'}
                    </span>
                  </div>

                  {/* Dose and Schedule */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-xs font-bold text-slate-800">{formatted.summaryAr}</div>
                    {formatted.reminderLabelAr && (
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
                        <Bell className="w-3.5 h-3.5" />
                        <span>تذكير يومي في: {formatted.reminderLabelAr}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Toggle Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {med.status === 'active' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateStatus(med.id, 'paused')}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        إيقاف مؤقت
                      </button>
                      <button
                        onClick={() => onUpdateStatus(med.id, 'completed')}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        إنهاء العلاج
                      </button>
                    </div>
                  ) : med.status === 'paused' ? (
                    <button
                      onClick={() => onUpdateStatus(med.id, 'active')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors"
                    >
                      استئناف العلاج الآن
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(med.id, 'active')}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg transition-colors"
                    >
                      إعادة تفعيل الدواء
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">
                إضافة دواء جديد ({memberName})
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدواء / العلاج *</label>
                <input
                  type="text"
                  placeholder="مثال: كونكور 5 مجم (Concor) أو شراب سيتال"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجرعة المحددة *</label>
                  <input
                    type="text"
                    placeholder="مثال: قرص واحد 5 مجم أو 5 مل"
                    value={dose}
                    onChange={e => setDose(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">معدل التكرار *</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  >
                    <option value="مرة واحدة يومياً صباحاً">مرة واحدة يومياً صباحاً</option>
                    <option value="مرة واحدة يومياً مساءً">مرة واحدة يومياً مساءً</option>
                    <option value="مرتين يومياً (كل 12 ساعة)">مرتين يومياً (كل 12 ساعة)</option>
                    <option value="3 مرات يومياً (كل 8 ساعات)">3 مرات يومياً (كل 8 ساعات)</option>
                    <option value="مرة واحدة أسبوعياً">مرة واحدة أسبوعياً</option>
                    <option value="عند اللزوم فقط">عند اللزوم فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تعليمات التناول (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: بعد الأكل مع كوب ماء وفير، أو على الريق قبل الإفطار"
                  value={timingNotes}
                  onChange={e => setTimingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ بدء العلاج</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الانتهاء المتوقع (اختياري)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Daily Reminder Setting */}
              <div className="p-3.5 bg-slate-50 border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span>تفعيل التنبيه بموعد الجرعة اليومية</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={e => setReminderEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                {reminderEnabled && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-600">وقت التذكير:</span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={e => setReminderTime(e.target.value)}
                      className="px-2 py-1 bg-white border rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الدواء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
