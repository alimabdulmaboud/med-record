"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { DocumentVault } from '@/components/med-record/DocumentVault';
import { DocumentUploadModal } from '@/components/med-record/DocumentUploadModal';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, MedicalDocument } from '@/types/med-record';

export default function DocumentsVaultPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
      await loadMemberDocs(primary.id);
    }
  };

  const loadMemberDocs = async (memberId: string) => {
    const docs = await repo.getDocuments(memberId);
    setDocuments(docs);
  };

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await loadMemberDocs(id);
  };

  const handleUploadSuccess = async (docData: Omit<MedicalDocument, 'id' | 'createdAt'>) => {
    await repo.addDocument(docData);
    await loadMemberDocs(activeMemberId);
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الوثيقة من الخزينة؟')) {
      await repo.deleteDocument(id);
      await loadMemberDocs(activeMemberId);
    }
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
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>خزينة الوثائق والتحاليل الطبية ({activeMember?.fullName})</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              أرشفة وتنظيم نتائج التحاليل، الأشعة والسونار، الروشتات، وتقارير العمليات والمستشفى
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>رفع وثيقة جديدة</span>
          </button>
        </div>

        {/* Document Vault Component */}
        <DocumentVault
          documents={documents}
          onDeleteDocument={handleDeleteDocument}
        />
      </main>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        memberId={activeMemberId}
        memberName={activeMember?.fullName || ''}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
