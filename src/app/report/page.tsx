"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/med-record/Header';
import { DoctorReportBuilder } from '@/components/med-record/DoctorReportBuilder';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type {
  FamilyMember,
  Measurement,
  Medication,
  Encounter,
  MedicalDocument,
  DoctorReport,
} from '@/types/med-record';
import { ArrowRight, FileText, Printer, Share2 } from 'lucide-react';

export default function DoctorReportPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const repo = getMedRecordRepository();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fam = await repo.getFamilyMembers();
      setMembers(fam);
      if (fam.length > 0) {
        const primary = fam.find(m => m.isPrimary) || fam[0];
        setActiveMemberId(primary.id);
        await loadMemberData(primary.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemberData = async (memberId: string) => {
    const [meas, meds, encs, docs] = await Promise.all([
      repo.getMeasurements(memberId),
      repo.getMedications(memberId),
      repo.getEncounters(memberId),
      repo.getDocuments(memberId),
    ]);
    setMeasurements(meas);
    setMedications(meds);
    setEncounters(encs);
    setDocuments(docs);
  };

  const handleSelectMember = async (memberId: string) => {
    setActiveMemberId(memberId);
    await loadMemberData(memberId);
  };

  const activeMember = members.find(m => m.id === activeMemberId);

  const handleSaveReport = async (reportData: {
    memberId: string;
    title: string;
    dateFrom: string;
    dateTo: string;
    includedSections: string[];
    summaryNotes?: string;
  }): Promise<DoctorReport> => {
    return repo.createDoctorReport(reportData);
  };

  const handleCreateShare = async (
    reportId: string,
    hours: number,
    pin?: string
  ): Promise<{ accessToken: string; expiresAt: string }> => {
    const share = await repo.createReportShare(reportId, hours, pin);
    return {
      accessToken: share.accessToken,
      expiresAt: share.expiresAt,
    };
  };

  const handleRevokeShare = async (token: string): Promise<void> => {
    const share = repo['shares'].find((s: any) => s.accessToken === token);
    if (share) {
      await repo.revokeReportShare(share.id);
    }
  };

  if (isLoading || !activeMember) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">جاري تجهيز تقرير الطبيب المعتمد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Header hidden on print */}
      <div className="print:hidden">
        <Header
          members={members}
          activeMemberId={activeMemberId}
          onSelectMember={handleSelectMember}
        />

        <div className="max-w-5xl mx-auto px-4 pt-4 pb-2" dir="rtl">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <DoctorReportBuilder
          member={activeMember}
          members={members}
          onSelectMember={handleSelectMember}
          measurements={measurements}
          medications={medications}
          encounters={encounters}
          documents={documents}
          onSaveReport={handleSaveReport}
          onCreateShare={handleCreateShare}
          onRevokeShare={handleRevokeShare}
        />
      </main>
    </div>
  );
}
