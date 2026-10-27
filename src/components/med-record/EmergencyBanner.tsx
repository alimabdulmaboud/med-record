"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Phone, Heart, ShieldAlert, ExternalLink } from 'lucide-react';
import type { FamilyMember } from '@/types/med-record';

interface EmergencyBannerProps {
  member: FamilyMember;
}

export function EmergencyBanner({ member }: EmergencyBannerProps) {
  const hasAllergies = member.allergies && member.allergies.length > 0;
  const hasContacts = member.emergencyContacts && member.emergencyContacts.length > 0;

  return (
    <div className="bg-linear-to-r from-rose-50 via-red-50/60 to-rose-50 border border-rose-200/80 rounded-2xl p-4 shadow-xs" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-rose-600/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-rose-950 uppercase tracking-wide">
                معلومات الطوارئ الحيوية ({member.fullName})
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[11px]">
                {member.bloodType}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rose-900">
              {hasAllergies ? (
                <div className="flex items-center gap-1 font-semibold text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  <span>الحساسية: {member.allergies?.join(' • ')}</span>
                </div>
              ) : (
                <span className="text-slate-600 text-[11px]">لا توجد حساسيات دوائية أو غذائية مسجلة</span>
              )}

              {member.chronicConditions && member.chronicConditions.length > 0 && (
                <span className="text-slate-700 font-medium text-[11px]">
                  الأمراض المزمنة: {member.chronicConditions.join(' • ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contacts & Quick Dial */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {hasContacts && (
            <div className="flex items-center gap-1.5">
              {member.emergencyContacts?.slice(0, 2).map(contact => (
                <a
                  key={contact.id}
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 shadow-xs transition-colors"
                  title={`اتصال طوارئ: ${contact.name}`}
                >
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <span>{contact.name.split(' ')[0]}</span>
                </a>
              ))}
            </div>
          )}

          <Link
            href={`/emergency/${member.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>بطاقة الطوارئ</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
