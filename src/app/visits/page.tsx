"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { VisitsLog } from '@/components/med-record/VisitsLog';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, Encounter } from '@/types/med-record';

export default function VisitsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [encounters, setEncounters] = useState<Encounter[]>([]);

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
      await loadMemberEncounters(primary.id);
    }
  };

  const loadMemberEncounters = async (memberId: string) => {
    const encs = await repo.getEncounters(memberId);
    setEncounters(encs);
  };

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await loadMemberEncounters(id);
  };

  const handleAddEncounter = async (encData: Omit<Encounter, 'id' | 'createdAt'>) => {
    await repo.addEncounter(encData);
    await loadMemberEncounters(activeMemberId);
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
            <Calendar className="w-6 h-6 text-purple-600" />
            <span>سجل الاستشارات وزيارات الأطباء ({activeMember?.fullName})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            توثيق التاريخ الطبي وتشخيصات الأطباء المعالجين ومواعيد المتابعة وإعادة الكشف
          </p>
        </div>

        <VisitsLog
          memberId={activeMemberId}
          memberName={activeMember?.fullName || ''}
          encounters={encounters}
          onAddEncounter={handleAddEncounter}
        />
      </main>
    </div>
  );
}
