"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  ArrowRight,
  User,
  Heart,
  ShieldAlert,
  Phone,
  Trash2,
  Check,
  Baby,
  Edit2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, RelationshipType, Gender, BloodType } from '@/types/med-record';

type RelationPreset =
  | 'son'
  | 'daughter'
  | 'wife'
  | 'husband'
  | 'father'
  | 'mother'
  | 'brother'
  | 'sister'
  | 'self'
  | 'other';

const RELATION_PRESETS: {
  id: RelationPreset;
  labelAr: string;
  relationship: RelationshipType;
  relationshipLabel: string;
  defaultSex: Gender;
}[] = [
  { id: 'son', labelAr: 'ابن (Son)', relationship: 'child', relationshipLabel: 'ابن', defaultSex: 'male' },
  { id: 'daughter', labelAr: 'ابنة (Daughter)', relationship: 'child', relationshipLabel: 'ابنة', defaultSex: 'female' },
  { id: 'wife', labelAr: 'زوجة (Wife)', relationship: 'spouse', relationshipLabel: 'زوجة', defaultSex: 'female' },
  { id: 'husband', labelAr: 'زوج (Husband)', relationship: 'spouse', relationshipLabel: 'زوج', defaultSex: 'male' },
  { id: 'father', labelAr: 'والد / أب (Father)', relationship: 'parent', relationshipLabel: 'والد', defaultSex: 'male' },
  { id: 'mother', labelAr: 'والدة / أم (Mother)', relationship: 'parent', relationshipLabel: 'والدة', defaultSex: 'female' },
  { id: 'brother', labelAr: 'أخ (Brother)', relationship: 'sibling', relationshipLabel: 'أخ', defaultSex: 'male' },
  { id: 'sister', labelAr: 'أخت (Sister)', relationship: 'sibling', relationshipLabel: 'أخت', defaultSex: 'female' },
  { id: 'self', labelAr: 'صاحب الحساب الأساسي (أنا)', relationship: 'self', relationshipLabel: 'صاحب الحساب الأساسي', defaultSex: 'male' },
  { id: 'other', labelAr: 'صلة قرابة أخرى...', relationship: 'other', relationshipLabel: 'أخرى', defaultSex: 'male' },
];

export default function ProfilesManagementPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [relationChoice, setRelationChoice] = useState<RelationPreset>('son');
  const [customRelationText, setCustomRelationText] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Gender>('male');
  const [bloodType, setBloodType] = useState<BloodType>('A+');
  const [allergiesText, setAllergiesText] = useState('');
  const [chronicText, setChronicText] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const repo = getMedRecordRepository();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const list = await repo.getFamilyMembers();
    setMembers(list);
    if (list.length > 0) {
      if (!activeMemberId) setActiveMemberId(list[0].id);
    } else {
      setIsAdding(true);
      setRelationChoice('self');
      setActiveMemberId('');
    }
  };

  const primaryMember =
    members.find(m => m.isPrimary) ||
    members.find(m => m.relationship === 'self') ||
    (members.length > 0 ? members[0] : null);

  const handleRelationChoiceChange = (choice: RelationPreset) => {
    setRelationChoice(choice);
    const preset = RELATION_PRESETS.find(p => p.id === choice);
    if (preset) {
      setSex(preset.defaultSex);
      if (preset.id !== 'other') {
        setCustomRelationText(preset.relationshipLabel);
      } else {
        setCustomRelationText('');
      }
    }
  };

  const handleStartEdit = (member: FamilyMember) => {
    setEditingMemberId(member.id);
    setFullName(member.fullName);
    setBirthDate(member.birthDate);
    setSex(member.sex);
    setBloodType(member.bloodType);
    setAllergiesText(member.allergies ? member.allergies.join('، ') : '');
    setChronicText(member.chronicConditions ? member.chronicConditions.join('، ') : '');

    if (member.emergencyContacts && member.emergencyContacts.length > 0) {
      setContactName(member.emergencyContacts[0].name);
      setContactPhone(member.emergencyContacts[0].phone);
    } else {
      setContactName('');
      setContactPhone('');
    }

    // Match relationship
    const foundPreset = RELATION_PRESETS.find(
      p => p.relationshipLabel === member.relationshipLabel || (p.relationship === member.relationship && p.defaultSex === member.sex)
    );
    if (foundPreset) {
      setRelationChoice(foundPreset.id);
      setCustomRelationText(member.relationshipLabel || foundPreset.relationshipLabel);
    } else {
      setRelationChoice('other');
      setCustomRelationText(member.relationshipLabel || member.relationship);
    }

    setIsAdding(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelForm = () => {
    setEditingMemberId(null);
    setFullName('');
    setBirthDate('');
    setAllergiesText('');
    setChronicText('');
    setContactName('');
    setContactPhone('');
    setIsAdding(false);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف ملف "${name}" وكافة قياساته وسجلاته نهائياً؟`)) {
      await repo.deleteFamilyMember(id);
      await loadMembers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !birthDate) return;

    const preset = RELATION_PRESETS.find(p => p.id === relationChoice);
    const relationshipType: RelationshipType = preset ? preset.relationship : 'other';
    const finalRelationLabel =
      relationChoice === 'other'
        ? (customRelationText.trim() || 'صلة أخرى')
        : (preset?.relationshipLabel || 'فرد عائلة');

    const allergies = allergiesText
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean);
    const chronic = chronicText
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean);

    const emergencyContacts = contactName && contactPhone
      ? [{ id: `c-${Date.now()}`, name: contactName, phone: contactPhone, relation: 'طوارئ' }]
      : [];

    const isPrimary = relationChoice === 'self' || members.length === 0;
    const avatarColor =
      relationshipType === 'child'
        ? (sex === 'female' ? 'bg-pink-500' : 'bg-blue-500')
        : isPrimary
        ? 'bg-emerald-600'
        : 'bg-purple-600';

    if (editingMemberId) {
      await repo.updateFamilyMember(editingMemberId, {
        fullName,
        relationship: relationshipType,
        relationshipLabel: finalRelationLabel,
        birthDate,
        sex,
        bloodType,
        allergies,
        chronicConditions: chronic,
        emergencyContacts,
      });
    } else {
      await repo.addFamilyMember({
        userId: 'user-demo-1',
        fullName,
        relationship: relationshipType,
        relationshipLabel: finalRelationLabel,
        birthDate,
        sex,
        bloodType,
        isPrimary,
        avatarColor,
        allergies,
        chronicConditions: chronic,
        emergencyContacts,
      });
    }

    handleCancelForm();
    await loadMembers();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans" dir="rtl">
      <Header
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={setActiveMemberId}
        onAddMember={() => {
          handleCancelForm();
          setIsAdding(true);
        }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>إدارة ملفات العائلة وتحديد صلة القرابة</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {primaryMember
                ? `صاحب الحساب الأساسي هو: "${primaryMember.fullName}". يتم ربط أفراد العائلة (الأبناء، الزوجة، الوالدين) به.`
                : 'أضف صاحب الحساب الأساسي ثم أضف أفراد الأسرة والأطفال لربطهم به.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (isAdding) handleCancelForm();
              else setIsAdding(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'إغلاق النموذج' : 'إضافة فرد جديد'}</span>
          </button>
        </div>

        {/* Add/Edit Member Form */}
        {isAdding && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-5 animate-in fade-in-50"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {editingMemberId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {editingMemberId ? 'تعديل بيانات الملف الطبي' : 'إضافة فرد جديد إلى ملف العائلة'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {primaryMember
                      ? `حدد صلة قرابة هذا الفرد مع صاحب الحساب الأساسي (${primaryMember.fullName})`
                      : 'سيكون هذا هو الملف الشخصي الأساسي لصاحب الحساب'}
                  </p>
                </div>
              </div>

              {primaryMember && relationChoice !== 'self' && (
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-900">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>الربط مع: {primaryMember.fullName}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: يوسف أحمد مصطفى"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-emerald-600"
                  required
                />
              </div>

              {/* Relationship with Primary Account Owner */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>
                    صلة القرابة {primaryMember ? `بـ (${primaryMember.fullName.split(' ')[0]}) *` : '*'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">محدد القرابة</span>
                </label>
                <select
                  value={relationChoice}
                  onChange={e => handleRelationChoiceChange(e.target.value as RelationPreset)}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:outline-emerald-600"
                >
                  <optgroup label="الأبناء">
                    <option value="son">👦 ابن (Son)</option>
                    <option value="daughter">👧 ابنة (Daughter)</option>
                  </optgroup>
                  <optgroup label="الزوج / الزوجة">
                    <option value="wife">💍 زوجة (Wife)</option>
                    <option value="husband">💍 زوج (Husband)</option>
                  </optgroup>
                  <optgroup label="الوالدين">
                    <option value="father">👴 والد / أب (Father)</option>
                    <option value="mother">👵 والدة / أم (Mother)</option>
                  </optgroup>
                  <optgroup label="الإخوة">
                    <option value="brother">👦 أخ (Brother)</option>
                    <option value="sister">👧 أخت (Sister)</option>
                  </optgroup>
                  <optgroup label="أخرى">
                    <option value="self">⭐ حسابي الشخصي (صاحب الحساب الأساسي)</option>
                    <option value="other">👤 صلة قرابة أخرى (حفيد، خال، عم، ابن أخ...)</option>
                  </optgroup>
                </select>
              </div>

              {/* Custom Relation input if 'other' chosen */}
              {relationChoice === 'other' && (
                <div className="sm:col-span-2 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-1">
                  <label className="block text-xs font-bold text-amber-950">
                    اكتب صلة القرابة المحددة مع صاحب الحساب ({primaryMember?.fullName || 'الأساسي'}):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: حفيد، ابن أخ، عم، خالة، جدة..."
                    value={customRelationText}
                    onChange={e => setCustomRelationText(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-amber-600"
                    required
                  />
                </div>
              )}

              {/* Birth Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-emerald-600"
                  required
                />
              </div>

              {/* Gender & Blood Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع / الجنس</label>
                  <select
                    value={sex}
                    onChange={e => setSex(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="male">ذكر (Male)</option>
                    <option value="female">أنثى (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">فصيلة الدم</label>
                  <select
                    value={bloodType}
                    onChange={e => setBloodType(e.target.value as BloodType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 font-mono"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'].map(bt => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحساسيات المعروفة (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="مثال: حساسية البنسلين، حساسية الفول السوداني"
                  value={allergiesText}
                  onChange={e => setAllergiesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الأمراض المزمنة (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="مثال: ارتفاع ضغط الدم، حساسية صدرية، سكري"
                  value={chronicText}
                  onChange={e => setChronicText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Emergency Contact Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  جهة اتصال الطوارئ (الاسم)
                </label>
                <input
                  type="text"
                  placeholder="مثال: منى إبراهيم (الأم)"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم هاتف الطوارئ
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 01012345678"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingMemberId ? 'حفظ التعديلات' : 'حفظ الفرد في العائلة'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Existing Members Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(member => {
            const isSelfOrPrimary = member.isPrimary || member.relationship === 'self';
            const relationBadge = isSelfOrPrimary
              ? 'صاحب الحساب الأساسي ⭐'
              : `${member.relationshipLabel || (member.sex === 'female' ? 'ابنة' : 'ابن')} (لـ ${
                  primaryMember?.fullName.split(' ')[0] || 'صاحب الحساب'
                })`;

            return (
              <div
                key={member.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                  member.id === activeMemberId
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/10'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                          member.avatarColor || 'bg-emerald-600'
                        }`}
                      >
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{member.fullName}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                              isSelfOrPrimary
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {relationBadge}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{member.birthDate}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black font-mono">
                      {member.bloodType}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs pt-2.5 border-t border-slate-100">
                    {member.allergies && member.allergies.length > 0 && (
                      <div className="text-rose-700 font-medium">
                        ⚠️ الحساسيات: {member.allergies.join('، ')}
                      </div>
                    )}

                    {member.chronicConditions && member.chronicConditions.length > 0 && (
                      <div className="text-slate-700 font-medium">
                        🩺 الأمراض المزمنة: {member.chronicConditions.join('، ')}
                      </div>
                    )}

                    {member.emergencyContacts && member.emergencyContacts.length > 0 && (
                      <div className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          طوارئ: {member.emergencyContacts[0].name} ({member.emergencyContacts[0].phone})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/emergency/${member.id}`}
                      className="text-xs font-bold text-rose-700 hover:text-rose-800"
                    >
                      بطاقة الطوارئ
                    </Link>

                    <button
                      onClick={() => handleStartEdit(member)}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMember(member.id, member.fullName)}
                      className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveMemberId(member.id)}
                    className={`text-xs font-bold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg transition-all ${
                      member.id === activeMemberId
                        ? 'bg-emerald-100 text-emerald-800 font-black'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span>{member.id === activeMemberId ? 'الملف النشط' : 'اختيار'}</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
