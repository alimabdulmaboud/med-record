"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/types/family';

export default function EmergencyIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("med_family_people");
      if (stored) {
        const people: Person[] = JSON.parse(stored);
        if (people.length > 0) {
          router.replace(`/emergency/${people[0].id}`);
          return;
        }
      }
    } catch {
      // fallback
    }
    // Default demo primary
    router.replace(`/emergency/p-ahmed`);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white" dir="rtl">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-rose-200">جاري فتح بطاقة الطوارئ الطبية...</p>
      </div>
    </div>
  );
}
