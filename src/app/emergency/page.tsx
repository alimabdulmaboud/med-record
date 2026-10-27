"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMedRecordRepository } from '@/lib/med-record/repository';

export default function EmergencyIndexPage() {
  const router = useRouter();
  const repo = getMedRecordRepository();

  useEffect(() => {
    async function redirect() {
      const members = await repo.getFamilyMembers();
      if (members.length > 0) {
        const primary = members.find(m => m.isPrimary) || members[0];
        router.replace(`/emergency/${primary.id}`);
      } else {
        router.replace('/');
      }
    }
    redirect();
  }, [repo, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white" dir="rtl">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-rose-200">جاري فتح بطاقة الطوارئ الطبية...</p>
      </div>
    </div>
  );
}
