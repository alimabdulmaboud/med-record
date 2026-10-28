"use client";

import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  Check,
  Calendar,
  Building2,
  User,
  Tag,
  Sparkles,
} from "lucide-react";
import type { Person } from "@/types/family";
import type {
  PersonDocument,
  DocumentCategory,
} from "@/types/documents";
import {
  DOCUMENT_CATEGORIES,
  validateFileUpload,
  formatFileSize,
} from "./document-vault-utils";
import { addPersonDocument } from "@/lib/family/documents-service";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  onSuccess?: (doc: PersonDocument) => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  person,
  onSuccess,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("lab_result");
  const [doctorName, setDoctorName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    const validation = validateFileUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errorAr || "ملف غير صالح");
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
    });

    if (!title) {
      // Suggest clean title from file name
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      setTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("يرجى كتابة عنوان للمستند الطبي");
      return;
    }

    const fileName = selectedFile?.name || `${title.replace(/\s+/g, "_")}.pdf`;
    const fileSize = selectedFile?.size || 1024 * 350; // default 350KB
    const fileType = selectedFile?.type || "application/pdf";

    const tags = tagsInput
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setSubmitting(true);
      const doc = await addPersonDocument({
        family_id: person.family_id,
        person_id: person.id,
        title: title.trim(),
        document_type: category,
        file_name: fileName,
        file_type: fileType,
        file_size_bytes: fileSize,
        doctor_name: doctorName.trim() || undefined,
        facility_name: facilityName.trim() || undefined,
        document_date: documentDate,
        tags,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess(doc);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء حفظ المستند");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                رفع مستند طبي جديد
              </h2>
              <p className="text-xs text-slate-500">
                إضافة مستند لـ: <span className="font-bold text-teal-700 dark:text-teal-400">{person.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-teal-500/40 hover:border-teal-500 rounded-2xl p-5 text-center bg-teal-50/30 dark:bg-teal-950/20 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div className="text-xs">
                <p className="font-bold text-teal-800 dark:text-teal-200">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  انقر هنا لاختيار الملف أو اسحبه وأفلته
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  يدعم صيغ PDF، JPEG، PNG، WEBP (بحد أقصى 15 ميجابايت)
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              عنوان المستند <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تحليل دهون ثلاثية، أشعة سينية على الصدر..."
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              نوع وتصنيف المستند
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map((catKey) => {
                const cat = DOCUMENT_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {cat.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor and Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                اسم الطبيب المعالج
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="مثال: د. طارق السعدني"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                الجهة أو المعمل أو المركز
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="مثال: معامل البرج، كايرو سكان"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Date and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                تاريخ المستند / الفحص
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                وسوم للبحث (مفصولة بفواصل)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="مثال: كوليسترول، رنين، سكر"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ملاحظات أو خلاصة التقرير (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظة أو نتيجة رئيسية تود تذكرها..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "جاري الحفظ..." : "حفظ المستند في الخزينة"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
