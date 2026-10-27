"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Baby,
  Scale,
  Ruler,
  Droplets,
  Heart,
  Wind,
  Thermometer,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { MeasurementChart } from '@/components/med-record/MeasurementChart';
import { GrowthPercentileChart } from '@/components/med-record/GrowthPercentileChart';
import { QuickLogModal } from '@/components/med-record/QuickLogModal';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type {
  FamilyMember,
  Measurement,
  GrowthMeasurement,
  MeasurementType,
  MeasurementValues,
} from '@/types/med-record';
import { formatMeasurementValue } from '@/lib/med-record/quick-log-helper';

export default function MeasurementsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [growthList, setGrowthList] = useState<GrowthMeasurement[]>([]);

  const [activeTab, setActiveTab] = useState<MeasurementType | 'who_growth'>('blood_pressure');
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  const repo = getMedRecordRepository();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const list = await repo.getFamilyMembers();
    setMembers(list);
    if (list.length > 0) {
      const primary = list.find(m => m.isPrimary) || list[0];
      setActiveMemberId(primary.id);
      await loadMemberMeasurements(primary.id);
    }
  };

  const loadMemberMeasurements = async (memberId: string) => {
    const [mList, gList] = await Promise.all([
      repo.getMeasurements(memberId),
      repo.getGrowthMeasurements(memberId),
    ]);
    setMeasurements(mList);
    setGrowthList(gList);
  };

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await loadMemberMeasurements(id);
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القياس؟')) {
      await repo.deleteMeasurement(id);
      await loadMemberMeasurements(activeMemberId);
    }
  };

  const handleSaveMeasurement = async (
    type: MeasurementType,
    values: MeasurementValues,
    notes?: string
  ) => {
    await repo.addMeasurement({
      memberId: activeMemberId,
      measurementType: type,
      values,
      unit: type === 'blood_pressure' ? 'mmHg' : type === 'blood_sugar' ? (values.context === 'hba1c' ? '%' : 'mg/dL') : 'unit',
      notes,
      recordedAt: new Date().toISOString(),
    });
    await loadMemberMeasurements(activeMemberId);
  };

  const activeMember = members.find(m => m.id === activeMemberId) || members[0];
  const isChild = activeMember?.relationship === 'child';

  const tabOptions = [
    { id: 'blood_pressure', label: 'ضغط الدم', icon: Activity },
    { id: 'blood_sugar', label: 'السكر بالدم', icon: Droplets },
    { id: 'oxygen_saturation', label: 'الأكسجين SpO2', icon: Wind },
    { id: 'heart_rate', label: 'النبض', icon: Heart },
    { id: 'temperature', label: 'درجة الحرارة', icon: Thermometer },
    { id: 'weight', label: 'الوزن', icon: Scale },
    { id: 'height', label: 'الطول', icon: Ruler },
  ];

  if (isChild) {
    tabOptions.push(
      { id: 'head_circumference', label: 'محيط الرأس', icon: Baby },
      { id: 'who_growth', label: 'مخططات نمو WHO', icon: TrendingUp }
    );
  }

  const filteredMeasurements = measurements.filter(m => m.measurementType === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir="rtl">
      <Header
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={handleSelectMember}
        onAddMember={() => window.location.href = '/profiles'}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              <span>متابعة القياسات والمخططات البيانية ({activeMember?.fullName})</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تتبع تطور الضغط، السكر، المؤشرات الحيوية، ومنحنيات نمو منظمة الصحة العالمية
            </p>
          </div>

          <button
            onClick={() => setIsQuickLogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل قياس جديد</span>
          </button>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tabOptions.map(tab => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Metric Visualization Card */}
        {activeTab === 'who_growth' ? (
          <GrowthPercentileChart
            sex={activeMember?.sex || 'male'}
            childName={activeMember?.fullName || ''}
            records={growthList}
          />
        ) : (
          <div className="space-y-4">
            <MeasurementChart
              type={activeTab as MeasurementType}
              measurements={measurements}
            />

            {/* Historical Readings Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">
                  سجل القراءات السابقة ({filteredMeasurements.length})
                </h3>
                <span className="text-[11px] text-slate-400">مرتبة من الأحدث إلى الأقدم</span>
              </div>

              {filteredMeasurements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  لا توجد قراءات مسجلة لهذا المؤشر بعد
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMeasurements.slice().reverse().map(m => {
                    const formatted = formatMeasurementValue(m.measurementType, m.values);
                    const d = new Date(m.recordedAt);
                    const dateStr = d.toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={m.id}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 ${
                              m.isAbnormal ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-black text-slate-900">{formatted}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{dateStr}</span>
                              {m.notes && <span>• {m.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                              m.isAbnormal
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {m.isAbnormal ? 'غير طبيعي' : 'طبيعي'}
                          </span>

                          <button
                            onClick={() => handleDeleteMeasurement(m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف القياس"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quick Measurement Log Modal */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        memberId={activeMemberId}
        memberName={activeMember?.fullName || ''}
        isChild={isChild}
        onClose={() => setIsQuickLogOpen(false)}
        onSave={handleSaveMeasurement}
      />
    </div>
  );
}
