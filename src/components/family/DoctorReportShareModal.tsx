"use client";

import React, { useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  Lock,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface DoctorReportShareModalProps {
  isOpen: boolean;
  reportId: string;
  patientName: string;
  onClose: () => void;
  onCreateShare: (
    reportId: string,
    hours: number,
    pin?: string
  ) => Promise<{ accessToken: string; expiresAt: string }>;
  onRevokeShare?: (shareId: string) => Promise<void>;
  existingShare?: {
    id: string;
    accessToken: string;
    expiresAt: string;
    accessCount: number;
    isRevoked: boolean;
  } | null;
}

export function DoctorReportShareModal({
  isOpen,
  reportId,
  patientName,
  onClose,
  onCreateShare,
  onRevokeShare,
  existingShare,
}: DoctorReportShareModalProps) {
  const [hours, setHours] = useState(72);
  const [pin, setPin] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingShare ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${existingShare.accessToken}` : null
  );
  const [shareId, setShareId] = useState<string | null>(existingShare?.id || null);
  const [expiresAtStr, setExpiresAtStr] = useState<string | null>(existingShare?.expiresAt || null);
  const [accessCount, setAccessCount] = useState<number>(existingShare?.accessCount || 0);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoked, setIsRevoked] = useState(existingShare?.isRevoked || false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await onCreateShare(reportId, hours, pin.trim() || undefined);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const fullUrl = `${origin}/share/${res.accessToken}`;
      setShareUrl(fullUrl);
      setExpiresAtStr(res.expiresAt);
      setIsRevoked(false);
      setAccessCount(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async () => {
    if (!shareId || !onRevokeShare) return;
    await onRevokeShare(shareId);
    setIsRevoked(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">
              مشاركة رابط طبي مؤمن للطبيب
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <span className="text-xs font-bold text-slate-500 block">المريض:</span>
            <span className="text-sm font-black text-slate-900">{patientName}</span>
          </div>

          {!shareUrl ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  مدة صلاحية الرابط (تنتهي تلقائياً):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[24, 48, 72].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        hours === h
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {h} ساعة {h === 72 ? '(موصى به)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  رمز سري اختياري (PIN مكون من 4 أرقام):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="مثال: 1234 (اختياري لزيادة الأمان)"
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  إذا حددت رمزاً، فلن يتمكن الطبيب من فتح التقرير إلا بعد إدخاله.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{isGenerating ? 'جارٍ إنشاء الرابط المؤمّن...' : 'إنشاء رابط المشاركة الطبي'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {isRevoked ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>تم إلغاء صلاحية هذا الرابط</span>
                  </div>
                  <p className="text-[11px] text-rose-600">
                    لم يعد بإمكان أي شخص فتح التقرير باستخدام هذا الرابط.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>
                        ينتهي في:{' '}
                        <strong className="font-mono">
                          {expiresAtStr ? new Date(expiresAtStr).toLocaleString('ar-EG') : '72 ساعة'}
                        </strong>
                      </span>
                    </div>
                    {accessCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full font-bold">
                        <Eye className="w-3 h-3" />
                        <span>{accessCount} مشاهدة</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      رابط التقرير المباشر:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح الرابط في صفحة جديدة</span>
                    </a>

                    {onRevokeShare && (
                      <button
                        type="button"
                        onClick={handleRevoke}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold cursor-pointer"
                      >
                        إلغاء الصلاحية فوراً
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
