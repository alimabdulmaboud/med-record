"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Clock,
  Save,
  HelpCircle,
  PhoneCall,
  User,
  Activity,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import type { FamilyMember, Medication, TriageAssessment, TriageMessage, UrgencyLevel } from '@/types/med-record';
import { analyzeInitialComplaint, generateTriageAssessment, type SymptomRule } from '@/lib/med-record/triage-engine';
import { getMedRecordRepository } from '@/lib/med-record/repository';

interface SymptomTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  onAssessmentSaved?: () => void;
}

export function SymptomTriageModal({
  isOpen,
  onClose,
  member,
  onAssessmentSaved
}: SymptomTriageModalProps) {
  const [messages, setMessages] = useState<TriageMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentRule, setCurrentRule] = useState<SymptomRule | null>(null);
  const [primaryComplaint, setPrimaryComplaint] = useState('');
  const [answersLog, setAnswersLog] = useState<string[]>([]);
  const [step, setStep] = useState<'initial' | 'question_1' | 'question_2' | 'completed'>('initial');
  const [assessment, setAssessment] = useState<TriageAssessment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const repo = getMedRecordRepository();

  useEffect(() => {
    if (isOpen && member) {
      resetSession();
      loadMedications();
    }
  }, [isOpen, member?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing, assessment]);

  const loadMedications = async () => {
    if (!member) return;
    const meds = await repo.getMedications(member.id);
    setMedications(meds.filter(m => m.status === 'active'));
  };

  const resetSession = () => {
    if (!member) return;
    const birthYear = new Date(member.birthDate).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    const ageText = age > 0 ? `${age} سنة` : 'أشهر';

    const welcomeText = `أهلاً بك. أنا مساعد الفحص الذكي وتوجيه التخصصات لـ "${member.fullName}" (${member.relationshipLabel || 'فرد العائلة'}، ${ageText}).\n\nأخبرني بما تشعر به أو ما يشتكي منه الفرد (مثال: ألم في الصدر، صداع مع زغللة، مغص بالبطن، سخونة عند الطفل...) وسأطرح عليك أسئلة متابعة لمساعدتك في معرفة التخصص الطبي الأنسب.`;

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        quickOptions: [
          'صداع شديد وزغللة بالعين',
          'ألم وضغط في الصدر',
          'مغص حاد في البطن',
          'سخونة وكحة مستمرة',
          'ألم أسفل الظهر والمفاصل'
        ]
      }
    ]);
    setInputText('');
    setCurrentRule(null);
    setPrimaryComplaint('');
    setAnswersLog([]);
    setStep('initial');
    setAssessment(null);
    setIsSaved(false);
  };

  if (!isOpen || !member) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAnalyzing) return;

    setInputText('');

    const userMsg: TriageMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAnalyzing(true);

    setTimeout(() => {
      if (step === 'initial') {
        setPrimaryComplaint(text);
        const analysis = analyzeInitialComplaint(text, { member, currentMedications: medications });
        setCurrentRule(analysis.matchedRule);

        const replyMsg: TriageMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: `فهمت شكواك بخصوص (${text}).\n\n${analysis.firstQuestion}`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          quickOptions: analysis.quickOptions
        };

        setMessages(prev => [...prev, replyMsg]);
        setStep('question_1');
        setIsAnalyzing(false);
      } else if (step === 'question_1' && currentRule) {
        setAnswersLog(prev => [...prev, text]);

        if (currentRule.followUpQuestions.length > 1) {
          const secondQuestion = currentRule.followUpQuestions[1];
          const replyMsg: TriageMessage = {
            id: `msg-${Date.now() + 1}`,
            sender: 'assistant',
            text: secondQuestion.question,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            quickOptions: secondQuestion.quickOptions
          };
          setMessages(prev => [...prev, replyMsg]);
          setStep('question_2');
          setIsAnalyzing(false);
        } else {
          finishAssessment(primaryComplaint, text, currentRule);
        }
      } else if (step === 'question_2' && currentRule) {
        const fullAnswers = [...answersLog, text].join(' - ');
        finishAssessment(primaryComplaint, fullAnswers, currentRule);
      }
    }, 700);
  };

  const finishAssessment = (complaint: string, answers: string, rule: SymptomRule) => {
    const result = generateTriageAssessment(complaint, answers, rule, {
      member,
      currentMedications: medications
    });

    setAssessment(result);
    setStep('completed');
    setIsAnalyzing(false);

    const completionMsg: TriageMessage = {
      id: `msg-${Date.now() + 2}`,
      sender: 'assistant',
      text: `تم اكتمال تقييم الأعراض بناءً على إجاباتك والتاريخ الطبي لـ "${member.fullName}".\n\nالتخصص الطبي الموصى به: **${result.recommendedSpecialtyAr}**.\n\nيمكنك مراجعة التقرير الفوري أدناه وحفظه في سجلك الطبي بضغطة زر ليطلع عليه الطبيب.`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, completionMsg]);
  };

  const handleSaveToHistory = async () => {
    if (!assessment || isSaving || isSaved) return;
    setIsSaving(true);
    try {
      await repo.addEncounter({
        memberId: member.id,
        visitDate: new Date().toISOString().split('T')[0],
        doctorName: 'مساعد الفحص الذكي (AI Triage)',
        specialty: assessment.recommendedSpecialtyAr,
        chiefComplaint: assessment.primaryComplaint,
        diagnosis: `توجيه أعراض مبدئي: ${assessment.recommendedSpecialtyAr}`,
        notes: `${assessment.summaryNoteForRecord}\nالاحتمالات المبدئية: ${assessment.possibleCauses.join(' | ')}\nنصائح الراحة: ${assessment.comfortAdvice.join(' | ')}`,
        followUpDate: assessment.urgencyLevel === 'emergency' ? 'طوارئ فورية' : undefined
      });
      setIsSaved(true);
      onAssessmentSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const getUrgencyBadge = (level: UrgencyLevel) => {
    switch (level) {
      case 'emergency':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500 animate-pulse',
          label: '🚨 حالة طوارئ - توجه لأقرب مستشفى أو اتصل بـ 123'
        };
      case 'urgent':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: '⚠️ استشارة عاجلة - يوصى بالكشف خلال 24 ساعة'
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          label: 'ℹ️ كشف روتيني - حجز موعد عيادة منتظم'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">مساعد الفحص وتوجيه التخصصات</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Triage
                </span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span>ملف:</span>
                <span className="font-bold text-white">{member.fullName}</span>
                {member.chronicConditions && member.chronicConditions.length > 0 && (
                  <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded border border-slate-700">
                    🩺 {member.chronicConditions.join('، ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer Bar */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-[11px] text-amber-900 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>أداة استرشادية لفرز الأعراض وتحديد التخصص، وليست تشخيصاً طبياً نهائياً. في الطوارئ اتصل بـ 123.</span>
          </div>
          <button
            onClick={resetSession}
            className="text-[11px] font-bold text-amber-800 hover:underline shrink-0 cursor-pointer"
          >
            بدء من جديد
          </button>
        </div>

        {/* Chat / Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`block text-[9px] mt-1.5 font-mono ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Quick reply chips (if assistant & active) */}
                {!isUser && msg.quickOptions && step !== 'completed' && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%]">
                    {msg.quickOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(opt)}
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-bold text-slate-700 hover:text-emerald-800 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2 px-3 bg-white/80 rounded-2xl w-fit border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>جاري الفحص الطبي وربط الأعراض بالتاريخ المرضي...</span>
            </div>
          )}

          {/* Assessment Result Card */}
          {assessment && (
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500/40 shadow-lg space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              {/* Urgency Alert */}
              {(() => {
                const badge = getUrgencyBadge(assessment.urgencyLevel);
                return (
                  <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${badge.bg}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                    <span>{badge.label}</span>
                  </div>
                );
              })()}

              {/* Recommended Specialty */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                    التخصص الطبي الأنسب للكشف
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                    <span>{assessment.recommendedSpecialtyAr}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {assessment.urgencyExplanationAr}
                  </p>
                </div>
              </div>

              {/* Possible Causes */}
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>الاحتمالات الطبية المبدئية:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {assessment.possibleCauses.map((cause, i) => (
                    <div key={i} className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-start gap-1.5 font-medium">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comfort & Safe Advice */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
                <h4 className="text-xs font-black text-blue-900 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>إرشادات أولية للراحة وتجنب المضاعفات:</span>
                </h4>
                <ul className="text-xs text-blue-950 space-y-1 list-disc list-inside">
                  {assessment.comfortAdvice.map((adv, i) => (
                    <li key={i} className="leading-relaxed">{adv}</li>
                  ))}
                </ul>
              </div>

              {/* Questions for Doctor */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>أسئلة مقترحة تسألها للطبيب أثناء الكشف:</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-1">
                  {assessment.questionsForDoctor.map((q, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">؟</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  onClick={handleSaveToHistory}
                  disabled={isSaving || isSaved}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isSaved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>تم الحفظ في السجل الطبي لـ {member.fullName}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الاستشارة في السجل الطبي'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={resetSession}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  فحص عرض آخر
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                step === 'initial'
                  ? 'اكتب ما تشعر به بالتفصيل (مثل: ألم بالصدر، صداع شديد، مغص...)'
                  : 'اكتب إجابتك أو اختر من المقترحات أعلاه...'
              }
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white transition-all"
              disabled={isAnalyzing}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isAnalyzing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
