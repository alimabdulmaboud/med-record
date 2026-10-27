"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Calendar,
  Heart,
  AlertCircle,
  Phone,
  Shield,
  Save,
  ArrowRight,
  Plus,
  X,
} from "lucide-react";
import type { CreatePersonInput, UpdatePersonInput, Person, BloodType, Sex } from "@/types/family";

interface PersonFormProps {
  initialData?: Person;
  onSubmit: (data: CreatePersonInput | UpdatePersonInput) => Promise<void>;
  isEditing?: boolean;
}

const COMMON_ALLERGIES = ["بنسلين", "فول سوداني", "ألبان", "أسبرين", "بيض", "سمسم", "سلفا"];
const COMMON_CONDITIONS = ["ارتفاع ضغط الدم", "السكري", "حساسية الصدر (ربو)", "الغدة الدرقية", "أنيميا"];
const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];

export function PersonForm({ initialData, onSubmit, isEditing = false }: PersonFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [birthDate, setBirthDate] = useState(initialData?.birth_date || "");
  const [sex, setSex] = useState<Sex>(initialData?.sex || "male");
  const [bloodType, setBloodType] = useState<BloodType>(initialData?.blood_type || "unknown");
  const [allergies, setAllergies] = useState<string[]>(initialData?.allergies || []);
  const [newAllergy, setNewAllergy] = useState("");
  const [chronicConditions, setChronicConditions] = useState<string[]>(initialData?.chronic_conditions || []);
  const [newCondition, setNewCondition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  
  // Emergency contact (for new person)
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("الأب");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAllergy = (item: string) => {
    if (allergies.includes(item)) {
      setAllergies(allergies.filter((a) => a !== item));
    } else {
      setAllergies([...allergies, item]);
    }
  };

  const addCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const toggleCondition = (item: string) => {
    if (chronicConditions.includes(item)) {
      setChronicConditions(chronicConditions.filter((c) => c !== item));
    } else {
      setChronicConditions([...chronicConditions, item]);
    }
  };

  const addCustomCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
      setChronicConditions([...chronicConditions, newCondition.trim()]);
      setNewCondition("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("يرجى كتابة الاسم");
      return;
    }
    if (!birthDate) {
      setError("يرجى تحديد تاريخ الميلاد");
      return;
    }

    setLoading(true);

    try {
      const payload: CreatePersonInput = {
        name: name.trim(),
        birth_date: birthDate,
        sex,
        blood_type: bloodType,
        allergies,
        chronic_conditions: chronicConditions,
        phone_number: phoneNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (!isEditing && emergencyName.trim() && emergencyPhone.trim()) {
        payload.emergency_contacts = [
          {
            name: emergencyName.trim(),
            relationship: emergencyRel,
            phone: emergencyPhone.trim(),
            is_primary: true,
          },
        ];
      }

      await onSubmit(payload);
      router.push("/family");
    } catch (err) {
      setError((err as Error).message || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto" dir="rtl">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Basic Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          <span>البيانات الأساسية</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            الاسم الكامل *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: سارة أحمد مصطفى"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              تاريخ الميلاد *
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              الجنس *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSex("male")}
                className={`py-2 text-sm font-semibold rounded-xl border transition-all ${
                  sex === "male"
                    ? "bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-900 dark:text-teal-200"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                ذكر
              </button>
              <button
                type="button"
                onClick={() => setSex("female")}
                className={`py-2 text-sm font-semibold rounded-xl border transition-all ${
                  sex === "female"
                    ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                أنثى
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            فصيلة الدم
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => setBloodType(bt)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  bloodType === bt
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {bt === "unknown" ? "غير معروف" : bt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Medical Alerts (Allergies & Conditions) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          <span>التنبيهات الصحية والحساسية</span>
        </h2>

        {/* Allergies */}
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            الحساسية (أدوية أو أطعمة)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COMMON_ALLERGIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleAllergy(item)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  allergies.includes(item)
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="إضافة حساسية أخرى..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={addCustomAllergy}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg"
            >
              إضافة
            </button>
          </div>

          {/* Active Allergy Badges */}
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {allergies.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold"
                >
                  {a}
                  <button type="button" onClick={() => toggleAllergy(a)}>
                    <X className="w-3 h-3 hover:text-rose-900" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chronic Conditions */}
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            الأمراض المزمنة
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COMMON_CONDITIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleCondition(item)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  chronicConditions.includes(item)
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="إضافة حالة مزمنة أخرى..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={addCustomCondition}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg"
            >
              إضافة
            </button>
          </div>

          {chronicConditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {chronicConditions.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-semibold"
                >
                  {c}
                  <button type="button" onClick={() => toggleCondition(c)}>
                    <X className="w-3 h-3 hover:text-amber-900" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Emergency Contact & Phone */}
      {!isEditing && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-600" />
            <span>جهة اتصال الطوارئ (اختياري)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                اسم جهة الاتصال
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="منى الشاذلي"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                صلة القرابة
              </label>
              <select
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="الأب">الأب</option>
                <option value="الأم">الأم</option>
                <option value="الزوج">الزوج / الزوجة</option>
                <option value="أخ/أخت">أخ / أخت</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Future Linking & Notes */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            رقم الهاتف الشخصي (اختياري - للربط المعتمد مع العيادات مستقبلاً)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+201012345678"
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            ملاحظات طبية خاصة
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات خاصة بالتاريخ الطبي أو الأدوية المستمرة..."
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "جاري الحفظ..." : isEditing ? "حفظ التعديلات" : "إضافة إلى أفراد الأسرة"}</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/family")}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-2xl transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
