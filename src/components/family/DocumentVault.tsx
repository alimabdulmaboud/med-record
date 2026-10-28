"use client";

import React, { useState } from "react";
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
  Plus,
} from "lucide-react";
import type { PersonDocument, DocumentCategory } from "@/types/documents";
import {
  DOCUMENT_CATEGORIES,
  formatFileSize,
} from "./document-vault-utils";
import { getDocumentDownloadUrl } from "@/lib/family/documents-service";

interface DocumentVaultProps {
  documents: PersonDocument[];
  onUploadClick?: () => void;
  onDeleteDocument?: (id: string) => Promise<void>;
}

export function DocumentVault({
  documents,
  onUploadClick,
  onDeleteDocument,
}: DocumentVaultProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = documents.filter((doc) => {
    if (selectedCategory !== "all" && doc.document_type !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchDoc = doc.doctor_name?.toLowerCase().includes(q) ?? false;
      const matchFac = doc.facility_name?.toLowerCase().includes(q) ?? false;
      const matchNotes = doc.notes?.toLowerCase().includes(q) ?? false;
      const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDoc || matchFac || matchNotes || matchTags;
    }

    return true;
  });

  const handleDownload = async (doc: PersonDocument) => {
    try {
      setDownloadingId(doc.id);
      const signedUrl = await getDocumentDownloadUrl(doc.id, 900);
      window.open(signedUrl, "_blank");
    } catch (err) {
      console.error("Error opening document:", err);
      alert("تعذر فتح المستند أو انتهت صلاحية الرابط");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، اسم المعمل، اسم الطبيب، أو الوسم (مثال: CBC، رنين، سكر)..."
              className="w-full pl-4 pr-10 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Upload Button */}
          {onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-sm shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>رفع مستند جديد</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            الكل ({documents.length})
          </button>

          {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map((catKey) => {
            const cat = DOCUMENT_CATEGORIES[catKey];
            const count = documents.filter((d) => d.document_type === catKey).length;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {cat.labelAr} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-teal-900 dark:text-teal-200 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>
            الخزينة آمنة تماماً: المستندات والتحاليل تفتح بروابط مؤقتة تنتهي صلاحيتها تلقائياً خلال 15 دقيقة لمنع التسريب.
          </span>
        </div>
        <span className="hidden sm:inline font-bold text-[10px] text-teal-700 dark:text-teal-400">
          HMAC-SHA Signed URLs
        </span>
      </div>

      {/* Documents List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
            لا توجد مستندات في هذا التصنيف
          </p>
          <p className="text-xs text-slate-400">
            يمكنك رفع نتائج التحاليل وصور الأشعة والروشتات بالضغط على زر "رفع مستند جديد".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((doc) => {
            const cat = DOCUMENT_CATEGORIES[doc.document_type] || DOCUMENT_CATEGORIES.lab_result;
            const isDownloading = downloadingId === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top: Category pill & Date */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cat.color} ${cat.border}`}
                    >
                      {cat.labelAr}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{doc.document_date}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {doc.title}
                  </h4>

                  {/* Doctor & Facility */}
                  <div className="space-y-0.5 text-xs text-slate-500">
                    {doc.facility_name && (
                      <p className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.facility_name}</span>
                      </p>
                    )}
                    {doc.doctor_name && (
                      <p className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.doctor_name}</span>
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-2">
                      {doc.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes snippet */}
                  {doc.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl mt-2 line-clamp-2">
                      {doc.notes}
                    </p>
                  )}
                </div>

                {/* Footer Actions: File size, Download & Delete */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    {formatFileSize(doc.file_size_bytes)} • {doc.file_name.split(".").pop()?.toUpperCase()}
                  </span>

                  <div className="flex items-center gap-2">
                    {onDeleteDocument && (
                      <button
                        type="button"
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="حذف المستند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-900 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isDownloading ? "جاري الفتح..." : "عرض وتحميل"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
