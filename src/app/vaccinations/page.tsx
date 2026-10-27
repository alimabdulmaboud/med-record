"use client";

import React, { useState, useEffect } from 'react';
import { Syringe, Baby, Users, ArrowRight } from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { VaccinationTracker } from '@/components/med-record/VaccinationTracker';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, Vaccination } from '@/types/med-record';

export default function VaccinationsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  const repo = getMedRecordRepository();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const list = await repo.getFamilyMembers();
    setMembers(list);
    if (list.length > 0) {
      // Prefer selecting a child if available for vaccinations
      const child = list.find(m => m.relationship === 'child') || list[0];
      setActiveMemberId(child.id);
      await loadMemberVaccinations(child.id);
    }
  };

  const loadMemberVaccinations = async (memberId: string) => {
    const vacs = await repo.getVaccinations(memberId);
    setVaccinations(vacs);
  };

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await loadMemberVaccinations(id);
  };

  const handleRecordDose = async (vacData: {
    vaccineName: string;
    targetDisease: string;
    doseNumber: number;
    administeredDate: string;
    batchNumber?: string;
    notes?: string;
  }) => {
    await repo.addVaccination({
      memberId: activeMemberId,
      vaccineName: vacData.vaccineName,
      targetDisease: vacData.targetDisease,
      doseNumber: vacData.doseNumber,
      scheduledDate: vacData.administeredDate,
      administeredDate: vacData.administeredDate,
      status: 'completed',
      batchNumber: vacData.batchNumber,
      notes: vacData.notes,
    });
    await loadMemberVaccinations(activeMemberId);
  };

  const activeMember = members.find(m => m.id === activeMemberId) || members[0];
  const isChild = activeMember?.relationship === 'child';
  const children = members.filter(m => m.relationship === 'child');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir="rtl">
      <Header
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={handleSelectMember}
        onAddMember={() => window.location.href = '/profiles'}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Syringe className="w-6 h-6 text-purple-600" />
            <span>متابعة جدول تطعيمات الأطفال ({activeMember?.fullName})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            الجدول الإجباري المعتمد من وزارة الصحة والسكان بجمهورية مصر العربية من الولادة حتى 18 شهراً
          </p>
        </div>

        {!isChild && children.length > 0 ? (
          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Baby className="w-5 h-5 text-purple-700" />
              <span>الملف الحالي هو لشخص بالغ ({activeMember.fullName})</span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              جدول التطعيمات مخصص للأطفال والرضع لمتابعة تطعيمات مكاتب الصحة الإجبارية. اختر أحد أطفالك المسجلين لمتابعة تطعيماته:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => handleSelectMember(child.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  التبديل إلى ملف {child.fullName}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <VaccinationTracker
            memberId={activeMemberId}
            memberName={activeMember?.fullName || ''}
            birthDate={activeMember?.birthDate || '2026-01-01'}
            existingVaccinations={vaccinations}
            onRecordDose={handleRecordDose}
          />
        )}
      </main>
    </div>
  );
}
