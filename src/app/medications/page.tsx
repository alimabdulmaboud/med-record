"use client";

import React, { useState, useEffect } from 'react';
import { Pill, Plus } from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { MedicationsManager } from '@/components/med-record/MedicationsManager';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, Medication, MedicationStatus } from '@/types/med-record';

export default function MedicationsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([]);

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
      await loadMemberMeds(primary.id);
    }
  };

  const loadMemberMeds = async (memberId: string) => {
    const meds = await repo.getMedications(memberId);
    setMedications(meds);
  };

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await loadMemberMeds(id);
  };

  const handleAddMedication = async (medData: Omit<Medication, 'id' | 'createdAt'>) => {
    await repo.addMedication(medData);
    await loadMemberMeds(activeMemberId);
  };

  const handleUpdateStatus = async (id: string, status: MedicationStatus) => {
    await repo.updateMedication(id, { status });
    await loadMemberMeds(activeMemberId);
  };

  const handleDeleteMedication = async (id: string) => {
    await repo.deleteMedication(id);
    await loadMemberMeds(activeMemberId);
  };

  const activeMember = members.find(m => m.id === activeMemberId) || members[0];

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
            <Pill className="w-6 h-6 text-emerald-600" />
            <span>إدارة الأدوية والجرعات والتذكير ({activeMember?.fullName})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة الأدوية الحالية المزمنة والمؤقتة وتحديد مواعيد الجرعات والتنبيهات اليومية
          </p>
        </div>

        <MedicationsManager
          memberId={activeMemberId}
          memberName={activeMember?.fullName || ''}
          medications={medications}
          onAddMedication={handleAddMedication}
          onUpdateStatus={handleUpdateStatus}
          onDeleteMedication={handleDeleteMedication}
        />
      </main>
    </div>
  );
}
