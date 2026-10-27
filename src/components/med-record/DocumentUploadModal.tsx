"use client";

import React, { useState } from 'react';
import {
  Upload,
  X,
  FileText,
  Check,
  AlertTriangle,
  Tag,
  Calendar,
  Building2,
  User,
} from 'lucide-react';
import type { DocumentCategory, MedicalDocument } from '@/types/med-record';
import {
  DOCUMENT_CATEGORIES,
  validateDocumentUpload,
} from '@/lib/med-record/document-vault-helper';

interface DocumentUploadModalProps {
  isOpen: boolean;
  memberId: string;
  memberName: string;
  onClose: () => void;
  onUploadSuccess: (doc: Omit<MedicalDocument, 'id' | 'createdAt'>) => Promise<void>;
}

export function DocumentUploadModal({
  isOpen,
  memberId,
  memberName,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('lab_result');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [summary, setSummary] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocumentUpload({
      fileName: file.name,
      fileType: file.type,
      fileSizeBytes: file.size,
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errorAr || 'الملف غير صالح');
      setSelectedFile(null);
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    if (!title) {
      // Auto-populate title from filename without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !documentDate) {
      setErrorMsg('يرجى كتابة عنوان الوثيقة وتاريخها');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const fileName = selectedFile ? selectedFile.name : `${title}.pdf`;
    const fileType = selectedFile ? selectedFile.type : 'application/pdf';
    const fileSizeBytes = selectedFile ? selectedFile.size : 250000;
    const storagePath = `vault/${memberId}/${Date.now()}-${fileName}`;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await onUploadSuccess({
        memberId,
        title,
        documentType: category,
        storagePath,
        fileName,
        fileType,
        fileSizeBytes,
        documentDate,
        doctorName: doctorName.trim() || undefined,
        facilityName: facilityName.trim() || undefined,
        tags,
        extractedSummary: summary.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الوثيقة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-black text-slate-900">
              إضافة وثيقة أو تحليل طبي ({memberName})
            </h3>
            <p className="text-xs text-slate-500">حفظ مشفر ومحمي بروابط منتهية الصلاحية</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* File Picker / Drop Zone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              id="doc-file-input"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="doc-file-input" className="cursor-pointer block space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-700">
                {selectedFile ? selectedFile.name : 'اختر ملف PDF أو صورة التحليل/الأشعة'}
              </div>
              <div className="text-[10px] text-slate-400">
                {selectedFile
                  ? `الحجم: ${(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت`
                  : 'يدعم PDF، JPEG، PNG حتى 15 ميجابايت'}
              </div>
            </label>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تصنيف الوثيقة *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map(catKey => {
                const cat = DOCUMENT_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان أو نوع الفحص *
              </label>
              <input
                type="text"
                placeholder="مثال: صورة دم كاملة CBC"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ الفحص / الروشتة *
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={e => setDocumentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Doctor & Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الطبيب المعالج (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: د. حسام قنديل"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المعمل / المستشفى (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: معامل المختبر فرع الدقي"
                value={facilityName}
                onChange={e => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وسوم الكلمات المفتاحية (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              placeholder="مثال: كبد، كلى، سكر، رنين، أنيميا"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملخص النتائج أو الملاحظات
            </label>
            <textarea
              rows={2}
              placeholder="مثال: الهيموجلوبين 13.5 (طبيعي)، الصفائح الدموية 250 ألف، كفاءة الكلى ممتازة."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ الوثيقة في الخزينة'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
