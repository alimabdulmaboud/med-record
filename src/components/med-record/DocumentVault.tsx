"use client";

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Calendar,
  Building2,
  User,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Lock,
} from 'lucide-react';
import type { MedicalDocument, DocumentCategory } from '@/types/med-record';
import {
  DOCUMENT_CATEGORIES,
  filterDocuments,
} from '@/lib/med-record/document-vault-helper';
import { generateExpiringSignedUrl } from '@/lib/med-record/storage';

interface DocumentVaultProps {
  documents: MedicalDocument[];
  onDeleteDocument?: (id: string) => Promise<void>;
}

export function DocumentVault({ documents, onDeleteDocument }: DocumentVaultProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = filterDocuments(documents, {
    category: selectedCategory,
    search: searchQuery,
  });

  const handleDownload = async (doc: MedicalDocument) => {
    try {
      setDownloadingId(doc.id);
      // Generate 15-minute expiring cryptographic signed URL
      const signedUrl = await generateExpiringSignedUrl(doc.storagePath, 900);
      window.open(signedUrl, '_blank');
    } catch (err) {
      console.error('Error generating signed URL:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Search and Category Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="بحث بالاسم، اسم المعمل، اسم الطبيب، أو الوسم (مثال: كوليسترول، رنين، CBC)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الوثائق ({documents.length})
          </button>

          {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map(catKey => {
            const cat = DOCUMENT_CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;
            const count = documents.filter(d => d.documentType === catKey).length;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.labelAr}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Storage Notice */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-emerald-900 text-xs">
        <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="font-medium">
          الوثائق والتحاليل مخزنة بتشفير كامل. عند النقر على التحميل، يتم إنشاء رابط مؤقت مشفر ينتهي تلقائياً خلال 15 دقيقة لضمان أعلى خصوصية.
        </span>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد وثائق مطابقة</h4>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً' : 'لم يتم رفع وثائق في هذا القسم بعد'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const catInfo = DOCUMENT_CATEGORIES[doc.documentType];
            const isDownloading = downloadingId === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* Category Badge & Date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${catInfo.color}`}
                    >
                      {catInfo.labelAr}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {doc.documentDate}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {doc.title}
                  </h4>

                  {/* Doctor & Facility */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {doc.facilityName && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.facilityName}</span>
                      </div>
                    )}
                    {doc.doctorName && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.doctorName}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {doc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Summary / Extracted text */}
                  {doc.extractedSummary && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      {doc.extractedSummary}
                    </p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading ? 'جاري التحميل...' : 'تحميل آمن (رابط مؤقت)'}</span>
                  </button>

                  {onDeleteDocument && (
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف الوثيقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
