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
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  reportId: string;
  memberName: string;
  onClose: () => void;
  onCreateShare: (reportId: string, hours: number, pin?: string) => Promise<{ accessToken: string; expiresAt: string }>;
  onRevokeShare?: (token: string) => Promise<void>;
}

export function ShareModal({
  isOpen,
  reportId,
  memberName,
  onClose,
  onCreateShare,
  onRevokeShare,
}: ShareModalProps) {
  const [hours, setHours] = useState(24);
  const [pin, setPin] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAtStr, setExpiresAtStr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await onCreateShare(reportId, hours, pin.trim() || undefined);
      const fullUrl = `${window.location.origin}/share/${res.accessToken}`;
      setShareUrl(fullUrl);
      setExpiresAtStr(res.expiresAt);
      setIsRevoked(false);
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
    if (!shareUrl) return;
    const token = shareUrl.split('/').pop();
    if (token && onRevokeShare) {
      await onRevokeShare(token);
      setIsRevoked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">
              مشاركة رابط طبي مؤمن للطبيب
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            أنشئ رابطاً للقراءة فقط يمكن للطبيب فتحه من هاتفه أو حاسوبه بدون الحاجة لتسجيل حساب. ينتهي الرابط تلقائياً بعد المدة المحددة ويمكنك إيقافه في أي لحظة.
          </p>

          {!shareUrl ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مدة صلاحية الرابط:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { h: 24, label: '24 ساعة' },
                    { h: 48, label: '48 ساعة' },
                    { h: 168, label: '7 أيام' },
                  ].map(opt => (
                    <button
                      key={opt.h}
                      type="button"
                      onClick={() => setHours(opt.h)}
                      className={`py-2 px-3 rounded-xl border font-bold text-center transition-colors ${
                        hours === opt.h
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رمز سري PIN إضافي اختياري (4 أرقام)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="مثال: 1234 (اتركه فارغاً إن لم ترغب برمز سري)"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-center text-sm font-mono tracking-widest focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{isGenerating ? 'جاري إنشاء الرابط...' : 'إنشاء الرابط المؤقت الآن'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-950 block">
                  رابط التقرير الطبي المشترك جاهز:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-[11px] font-mono text-slate-800 select-all"
                    dir="ltr"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shrink-0 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>
                {expiresAtStr && (
                  <div className="text-[10px] text-slate-500">
                    ينتهي الرابط تلقائياً بتاريخ: {new Date(expiresAtStr).toLocaleString('ar-EG')}
                  </div>
                )}
                {pin && (
                  <div className="text-[10px] text-emerald-800 font-bold">
                    🔒 محمي برمز PIN: {pin} (يرجى إبلاغ الطبيب به)
                  </div>
                )}
              </div>

              {isRevoked ? (
                <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 text-center font-bold">
                  تم إيقاف صلاحية هذا الرابط بنجاح. لن يتمكن أحد من فتحه بعد الآن.
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>معاينة الرابط في صفحة جديدة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {onRevokeShare && (
                    <button
                      onClick={handleRevoke}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition-colors"
                    >
                      إيقاف الرابط فوراً
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
