"use client";

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, RelationshipType, Gender, BloodType } from '@/types/med-record';

export default function ProfilesManagementPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  // New Member Form State
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('child');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Gender>('male');
  const [bloodType, setBloodType] = useState<BloodType>('A+');
  const [allergiesText, setAllergiesText] = useState('');
  const [chronicText, setChronicText] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const repo = getMedRecordRepository();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const list = await repo.getFamilyMembers();
    setMembers(list);
    if (list.length > 0 && !activeMemberId) {
      setActiveMemberId(list[0].id);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !birthDate) return;

    const allergies = allergiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const chronic = chronicText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const emergencyContacts = contactName && contactPhone
      ? [{ id: `c-${Date.now()}`, name: contactName, phone: contactPhone, relation: 'طوارئ' }]
      : [];

    await repo.addFamilyMember({
      userId: 'user-demo-1',
      fullName,
      relationship,
      birthDate,
      sex,
      bloodType,
      avatarColor: relationship === 'child' ? 'bg-pink-500' : 'bg-emerald-600',
      allergies,
      chronicConditions: chronic,
      emergencyContacts,
    });

    // Reset Form
    setFullName('');
    setBirthDate('');
    setAllergiesText('');
    setChronicText('');
    setContactName('');
    setContactPhone('');
    setIsAdding(false);

    await loadMembers();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir="rtl">
      <Header
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={setActiveMemberId}
        onAddMember={() => setIsAdding(true)}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>إدارة ملفات العائلة</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              إضافة ومتابعة الملفات الصحية لأفراد الأسرة (الأطفال، الزوج/الزوجة، الوالدين)
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'إغلاق النموذج' : 'إضافة فرد جديد'}</span>
          </button>
        </div>

        {/* Add Member Form Modal / Accordion */}
        {isAdding && (
          <form
            onSubmit={handleAddMember}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 animate-in fade-in-50"
          >
            <h2 className="text-sm font-black text-slate-900 border-b pb-2">
              إضافة فرد جديد إلى ملف العائلة
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: يوسف أحمد مصطفى"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">صلة القرابة</label>
                <select
                  value={relationship}
                  onChange={e => setRelationship(e.target.value as RelationshipType)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="child">طفل / طفلة (Child)</option>
                  <option value="spouse">زوج / زوجة (Spouse)</option>
                  <option value="parent">والد / والدة (Parent)</option>
                  <option value="self">حسابي الشخصي (Self)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع / الجنس</label>
                  <select
                    value={sex}
                    onChange={e => setSex(e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
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
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-rose-700"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'].map(bt => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحساسيات المعروفة (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="مثال: حساسية البنسلين، حساسية الفراولة"
                  value={allergiesText}
                  onChange={e => setAllergiesText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الأمراض المزمنة (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="مثال: ربو شعبي، حساسية صدر، سكري"
                  value={chronicText}
                  onChange={e => setChronicText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم جهة اتصال الطوارئ
                </label>
                <input
                  type="text"
                  placeholder="مثال: منى إبراهيم (الأم)"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  هاتف الطوارئ
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 01012345678"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                حفظ الفرد الآن
              </button>
            </div>
          </form>
        )}

        {/* Existing Members Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(member => (
            <div
              key={member.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
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
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-emerald-700">
                          {member.relationship === 'self'
                            ? 'صاحب الحساب'
                            : member.relationship === 'child'
                            ? 'طفل / طفلة'
                            : member.relationship}
                        </span>
                        <span>•</span>
                        <span>{member.birthDate}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black">
                    {member.bloodType}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                  {member.allergies && member.allergies.length > 0 && (
                    <div className="text-rose-700 font-medium">
                      ⚠️ الحساسيات: {member.allergies.join('، ')}
                    </div>
                  )}

                  {member.chronicConditions && member.chronicConditions.length > 0 && (
                    <div className="text-slate-700 font-medium">
                      🩺 المزمن: {member.chronicConditions.join('، ')}
                    </div>
                  )}

                  {member.emergencyContacts && member.emergencyContacts.length > 0 && (
                    <div className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>
                        طوارئ: {member.emergencyContacts[0].name} ({member.emergencyContacts[0].phone})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/emergency/${member.id}`}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800"
                >
                  بطاقة الطوارئ
                </Link>
                <button
                  onClick={() => setActiveMemberId(member.id)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>اختيار كملف نشط</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
