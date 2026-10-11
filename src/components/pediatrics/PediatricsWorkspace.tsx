"use client";

import React, { useState } from "react";
import {
  FullPediatricRecord,
  BirthHistory,
  FeedingHistory,
  VaccinationRecord,
} from "@/modules/pediatrics/types";
import {
  saveBirthHistory,
  saveFeedingHistory,
  recordVaccination,
  updateMilestone,
  savePediatricExam,
  DEVELOPMENTAL_MILESTONES_CATALOG,
} from "@/modules/pediatrics/service";
import { GrowthChart } from "./GrowthChart";
import { t } from "@/lib/i18n";
import {
  Baby,
  Syringe,
  Milestone,
  FileCheck2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Save,
  Plus,
} from "lucide-react";

interface PediatricsWorkspaceProps {
  doctor: { id: string; role: string; clinicId: string };
  clinicEnabledModules: string[];
  patient: {
    id: string;
    name: string;
    dateOfBirth?: string;
    gender?: string;
  };
  initialRecord: FullPediatricRecord;
  currentMeasurements?: {
    weightKg?: number;
    heightCm?: number;
    headCircumferenceCm?: number;
  };
  historicalMeasurements?: Array<{
    date: string;
    weightKg?: number | null;
    heightCm?: number | null;
    headCircumferenceCm?: number | null;
  }>;
}

export function PediatricsWorkspace({
  doctor,
  clinicEnabledModules,
  patient,
  initialRecord,
  currentMeasurements,
  historicalMeasurements = [],
}: PediatricsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "growth" | "vaccines" | "milestones" | "history" | "exam"
  >("growth");

  const [record, setRecord] = useState<FullPediatricRecord>(initialRecord);

  // Birth History State
  const [birthForm, setBirthForm] = useState({
    gestationalAgeWeeks: record.birthHistory?.gestationalAgeWeeks || 39,
    deliveryType: record.birthHistory?.deliveryType || "vaginal",
    birthWeightKg: record.birthHistory?.birthWeightKg || 3.3,
    birthLengthCm: record.birthHistory?.birthLengthCm || 50,
    birthHeadCircumferenceCm: record.birthHistory?.birthHeadCircumferenceCm || 34.5,
    apgarScore1min: record.birthHistory?.apgarScore1min || 9,
    apgarScore5min: record.birthHistory?.apgarScore5min || 10,
    nicuStay: record.birthHistory?.nicuStay || false,
    nicuDays: record.birthHistory?.nicuDays || 0,
    complications: record.birthHistory?.complications || "",
    notes: record.birthHistory?.notes || "",
  });

  // Feeding History State
  const [feedingForm, setFeedingForm] = useState({
    feedingType: record.feedingHistory?.feedingType || "exclusive_breastfeeding",
    formulaName: record.feedingHistory?.formulaName || "",
    solidsStartAgeMonths: record.feedingHistory?.solidsStartAgeMonths || 6,
    vitaminDSupplement: record.feedingHistory?.vitaminDSupplement ?? true,
    ironSupplement: record.feedingHistory?.ironSupplement ?? false,
    notes: record.feedingHistory?.notes || "",
  });

  // Pediatric Exam State
  const [examForm, setExamForm] = useState({
    generalAppearance: "طفل واعي، نشط، غير شاحب، لا يعاني من ضائقة تنفسية",
    headNeck: "اليافوخ مغلق وطبيعي، الرأس متناسق، الأغشية المخاطية رطبة",
    cardiovascular: "أصوات القلب طبيعية S1 و S2 بدون لغط مرضي، النبض المحيطي جيد",
    respiratory: "أصوات تنفسية حويصلية متساوية، لا توجد تزييقات أو أزيز",
    abdomen: "لين وغير منتفخ، لا يوجد تضخم بالكبد أو الطحال",
    neurological: "ردود الأفعال العصبية والمنعكسات سليمة ومتناظرة",
    musculoskeletal: "حركة الأطراف والمفاصل حرة وطبيعية",
    skin: "خالٍ من الطفح الجلدي واليرقان والكدمات",
    notes: "",
  });

  // Vaccination Modal State
  const [selectedVacToRecord, setSelectedVacToRecord] = useState<{
    vaccineName: string;
    doseNumber: number;
  } | null>(null);
  const [vacForm, setVacForm] = useState({
    batchNumber: "LOT-" + Math.floor(1000 + Math.random() * 9000),
    site: "right_thigh" as any,
    notes: "",
  });

  const [milestoneFilterBand, setMilestoneFilterBand] = useState<string>("all");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Handlers
  const handleSaveBirth = () => {
    const updated = saveBirthHistory(
      doctor,
      {
        patientId: patient.id,
        ...birthForm,
      },
      clinicEnabledModules
    );
    setRecord((prev) => ({ ...prev, birthHistory: updated }));
    showSuccess("تم حفظ تاريخ الولادة بنجاح");
  };

  const handleSaveFeeding = () => {
    const updated = saveFeedingHistory(
      doctor,
      {
        patientId: patient.id,
        ...feedingForm,
      },
      clinicEnabledModules
    );
    setRecord((prev) => ({ ...prev, feedingHistory: updated }));
    showSuccess("تم حفظ تاريخ التغذية بنجاح");
  };

  const handleRecordVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacToRecord) return;

    const newVac = recordVaccination(
      doctor,
      {
        patientId: patient.id,
        vaccineName: selectedVacToRecord.vaccineName,
        doseNumber: selectedVacToRecord.doseNumber,
        administeredDate: new Date().toISOString().split("T")[0],
        batchNumber: vacForm.batchNumber,
        site: vacForm.site,
        status: "administered",
        notes: vacForm.notes,
      },
      clinicEnabledModules
    );

    // Update local schedule status
    setRecord((prev) => {
      const newVacList = [...prev.vaccinations, newVac];
      const updatedSchedule = prev.scheduleWithStatus.map((s) => {
        if (
          s.template.vaccineName === selectedVacToRecord.vaccineName &&
          s.template.doseNumber === selectedVacToRecord.doseNumber
        ) {
          return {
            ...s,
            record: newVac,
            calculatedStatus: "administered" as const,
          };
        }
        return s;
      });
      return {
        ...prev,
        vaccinations: newVacList,
        scheduleWithStatus: updatedSchedule,
      };
    });

    setSelectedVacToRecord(null);
    showSuccess("تم توثيق إعطاء التطعيم بنجاح");
  };

  const handleToggleMilestone = (key: string, currentAchieved: boolean) => {
    const updated = updateMilestone(
      doctor,
      patient.id,
      key,
      !currentAchieved,
      clinicEnabledModules
    );

    setRecord((prev) => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [key]: updated,
      },
    }));
  };

  const handleSaveExam = () => {
    const exam = savePediatricExam(
      doctor,
      {
        patientId: patient.id,
        ...examForm,
      },
      clinicEnabledModules
    );
    setRecord((prev) => ({
      ...prev,
      recentExams: [exam, ...prev.recentExams],
    }));
    showSuccess("تم حفظ الفحص الإكلينيكي بنجاح");
  };

  const handleFillAllNormalExam = () => {
    setExamForm({
      generalAppearance: "طفل واعي، نشط، غير شاحب، لا يعاني من ضائقة تنفسية",
      headNeck: "اليافوخ مغلق وطبيعي، الرأس متناسق، الأغشية المخاطية رطبة",
      cardiovascular: "أصوات القلب طبيعية S1 و S2 بدون لغط مرضي، النبض المحيطي جيد",
      respiratory: "أصوات تنفسية حويصلية متساوية، لا توجد تزييقات أو أزيز",
      abdomen: "لين وغير منتفخ، لا يوجد تضخم بالكبد أو الطحال",
      neurological: "ردود الأفعال العصبية والمنعكسات سليمة ومتناظرة",
      musculoskeletal: "حركة الأطراف والمفاصل حرة وطبيعية",
      skin: "خالٍ من الطفح الجلدي واليرقان والكدمات",
      notes: "الفحص السريري العام سليم بالكامل",
    });
  };

  const sex = patient.gender === "أنثى" ? "female" : "male";

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Baby className="w-6 h-6 text-emerald-200" />
          <div>
            <h2 className="font-bold text-base">{t("pediatrics.title")}</h2>
            <p className="text-xs text-emerald-100">
              ملف طب الأطفال: منحنيات النمو، التطعيمات الإلزامية، التطور الحركي، وتاريخ الولادة
            </p>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="bg-emerald-950/80 text-emerald-200 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {saveSuccessMsg}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("growth")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "growth"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Baby className="w-4 h-4 text-emerald-600" />
          {t("pediatrics.growthTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vaccines")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "vaccines"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Syringe className="w-4 h-4 text-teal-600" />
          {t("pediatrics.vaccinesTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("milestones")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "milestones"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Milestone className="w-4 h-4 text-blue-600" />
          {t("pediatrics.milestonesTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-600" />
          {t("pediatrics.historyTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("exam")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "exam"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-purple-600" />
          {t("pediatrics.examTitle")}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5">
        {/* 1. Growth Curves Tab */}
        {activeTab === "growth" && (
          <GrowthChart
            patientId={patient.id}
            patientName={patient.name}
            sex={sex}
            birthDate={patient.dateOfBirth || "2022-04-15"}
            gestationalAgeWeeks={record.birthHistory?.gestationalAgeWeeks || undefined}
            currentWeightKg={currentMeasurements?.weightKg}
            currentHeightCm={currentMeasurements?.heightCm}
            currentHeadCircumferenceCm={currentMeasurements?.headCircumferenceCm}
            historicalMeasurements={historicalMeasurements}
          />
        )}

        {/* 2. Vaccines Tab */}
        {activeTab === "vaccines" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {t("pediatrics.vaccinesTitle")} (وزارة الصحة المصرية)
                </h3>
                <p className="text-xs text-gray-500">
                  تتبع الجرعات المستحقة والمتأخرة وتوثيق إعطاء اللقاحات مع رقم التشغيلة
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs text-right">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">اسم التطعيم</th>
                    <th className="py-2.5 px-3">العمر المستهدف</th>
                    <th className="py-2.5 px-3">الجرعة</th>
                    <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3">تاريخ الإعطاء / التشغيلة</th>
                    <th className="py-2.5 px-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {record.scheduleWithStatus.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {item.template.vaccineName}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {item.template.targetAgeMonths === 0
                          ? "عند الولادة"
                          : `${item.template.targetAgeMonths} شهور`}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        جرعة {item.template.doseNumber}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{item.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.calculatedStatus === "administered"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.calculatedStatus === "overdue"
                                ? "bg-rose-100 text-rose-800"
                                : item.calculatedStatus === "due"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.calculatedStatus === "administered" && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {item.calculatedStatus === "overdue" && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {item.calculatedStatus === "due" && (
                            <Clock className="w-3 h-3" />
                          )}
                          {t(`pediatrics.status.${item.calculatedStatus}`)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {item.record?.administeredDate ? (
                          <span>
                            {item.record.administeredDate}
                            {item.record.batchNumber && ` (${item.record.batchNumber})`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.calculatedStatus !== "administered" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedVacToRecord({
                                vaccineName: item.template.vaccineName,
                                doseNumber: item.template.doseNumber,
                              })
                            }
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded border border-emerald-300 transition-colors"
                          >
                            توثيق الإعطاء
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-xs">مكتمل ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal for recording vaccine */}
            {selectedVacToRecord && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <form
                  onSubmit={handleRecordVaccine}
                  className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-200"
                >
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-emerald-600" />
                    {t("pediatrics.administerVaccine")}: {selectedVacToRecord.vaccineName}
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("pediatrics.batchNumber")}
                    </label>
                    <input
                      type="text"
                      value={vacForm.batchNumber}
                      onChange={(e) =>
                        setVacForm((f) => ({ ...f, batchNumber: e.target.value }))
                      }
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("pediatrics.site")}
                    </label>
                    <select
                      value={vacForm.site}
                      onChange={(e) =>
                        setVacForm((f) => ({ ...f, site: e.target.value as any }))
                      }
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                    >
                      <option value="right_thigh">الفخذ الأيمن (Right Thigh)</option>
                      <option value="left_thigh">الفخذ الأيسر (Left Thigh)</option>
                      <option value="right_deltoid">العضلة الدالية اليمنى (Right Deltoid)</option>
                      <option value="left_deltoid">العضلة الدالية اليسرى (Left Deltoid)</option>
                      <option value="oral">عن طريق الفم (Oral)</option>
                      <option value="intradermal">داخل الجلد (Intradermal)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("common.notes")}
                    </label>
                    <input
                      type="text"
                      value={vacForm.notes}
                      onChange={(e) =>
                        setVacForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="أي ملاحظات حول إعطاء الجرعة..."
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedVacToRecord(null)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 text-xs rounded"
                    >
                      {t("common.save")}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. Milestones Tab */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {t("pediatrics.milestonesTitle")}
                </h3>
                <p className="text-xs text-gray-500">
                  قائمة تحقق التطور الحركي واللغوي والإدراكي مقسمة حسب الفئات العمرية
                </p>
              </div>

              {/* Age Band Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500 font-semibold">تصفية بالعمر:</span>
                <select
                  value={milestoneFilterBand}
                  onChange={(e) => setMilestoneFilterBand(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="all">كل الفئات العمرية</option>
                  <option value="2_months">شهران</option>
                  <option value="4_months">4 شهور</option>
                  <option value="6_months">6 شهور</option>
                  <option value="9_months">9 شهور</option>
                  <option value="12_months">سنة (12 شهراً)</option>
                  <option value="18_months">سنة ونصف (18 شهراً)</option>
                  <option value="24_months">سنتان (24 شهراً)</option>
                  <option value="36_months">3 سنوات (36 شهراً)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEVELOPMENTAL_MILESTONES_CATALOG.filter(
                (m) =>
                  milestoneFilterBand === "all" ||
                  m.ageBand === milestoneFilterBand
              ).map((m) => {
                const isAchieved = Boolean(record.milestones[m.key]?.achieved);
                return (
                  <div
                    key={m.key}
                    onClick={() => handleToggleMilestone(m.key, isAchieved)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isAchieved
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                        : "bg-white border-gray-200 text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAchieved}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{m.titleAr}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {m.titleEn}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {m.ageBand.replace("_", " ")}
                        </span>
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {t(`pediatrics.milestones.${m.category === "gross_motor" ? "grossMotor" : m.category === "fine_motor" ? "fineMotor" : m.category === "speech_language" ? "speechLanguage" : "cognitiveSocial"}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Birth & Feeding History Tab */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Birth History Card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                تاريخ الولادة ومقاييس حديثي الولادة
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.gestationalAge")}
                  </label>
                  <input
                    type="number"
                    value={birthForm.gestationalAgeWeeks}
                    onChange={(e) =>
                      setBirthForm((f) => ({
                        ...f,
                        gestationalAgeWeeks: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.deliveryType")}
                  </label>
                  <select
                    value={birthForm.deliveryType}
                    onChange={(e) =>
                      setBirthForm((f) => ({
                        ...f,
                        deliveryType: e.target.value as any,
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  >
                    <option value="vaginal">{t("pediatrics.vaginal")}</option>
                    <option value="c_section">{t("pediatrics.cSection")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.birthWeight")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={birthForm.birthWeightKg}
                    onChange={(e) =>
                      setBirthForm((f) => ({
                        ...f,
                        birthWeightKg: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.birthLength")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={birthForm.birthLengthCm}
                    onChange={(e) =>
                      setBirthForm((f) => ({
                        ...f,
                        birthLengthCm: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.birthHeadCircumference")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={birthForm.birthHeadCircumferenceCm}
                    onChange={(e) =>
                      setBirthForm((f) => ({
                        ...f,
                        birthHeadCircumferenceCm: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.apgarScore")}
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="1د"
                      value={birthForm.apgarScore1min}
                      onChange={(e) =>
                        setBirthForm((f) => ({
                          ...f,
                          apgarScore1min: Number(e.target.value),
                        }))
                      }
                      className="w-1/2 border rounded px-2 py-1.5 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="5د"
                      value={birthForm.apgarScore5min}
                      onChange={(e) =>
                        setBirthForm((f) => ({
                          ...f,
                          apgarScore5min: Number(e.target.value),
                        }))
                      }
                      className="w-1/2 border rounded px-2 py-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={birthForm.nicuStay}
                    onChange={(e) =>
                      setBirthForm((f) => ({ ...f, nicuStay: e.target.checked }))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  {t("pediatrics.nicuStay")}
                </label>
                {birthForm.nicuStay && (
                  <div className="mt-2">
                    <label className="block text-gray-500 mb-1">
                      {t("pediatrics.nicuDays")}
                    </label>
                    <input
                      type="number"
                      value={birthForm.nicuDays}
                      onChange={(e) =>
                        setBirthForm((f) => ({
                          ...f,
                          nicuDays: Number(e.target.value),
                        }))
                      }
                      className="w-full border rounded px-2.5 py-1.5 bg-white"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  المضاعفات والملاحظات
                </label>
                <textarea
                  rows={2}
                  value={birthForm.notes}
                  onChange={(e) =>
                    setBirthForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full text-xs border rounded p-2 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveBirth}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                حفظ بيانات الولادة
              </button>
            </div>

            {/* Feeding History Card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Baby className="w-4 h-4 text-emerald-600" />
                تاريخ الرضاعة والتغذية التكميلية
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.feedingType")}
                  </label>
                  <select
                    value={feedingForm.feedingType}
                    onChange={(e) =>
                      setFeedingForm((f) => ({
                        ...f,
                        feedingType: e.target.value as any,
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  >
                    <option value="exclusive_breastfeeding">
                      {t("pediatrics.exclusiveBreastfeeding")}
                    </option>
                    <option value="formula">{t("pediatrics.formula")}</option>
                    <option value="mixed">{t("pediatrics.mixed")}</option>
                    <option value="solids_weaned">
                      {t("pediatrics.solidsWeaned")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.formulaName")}
                  </label>
                  <input
                    type="text"
                    value={feedingForm.formulaName}
                    onChange={(e) =>
                      setFeedingForm((f) => ({
                        ...f,
                        formulaName: e.target.value,
                      }))
                    }
                    placeholder="مثال: نان، بيبيلاك، سيميلاك..."
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    {t("pediatrics.solidsStartAge")}
                  </label>
                  <input
                    type="number"
                    value={feedingForm.solidsStartAgeMonths}
                    onChange={(e) =>
                      setFeedingForm((f) => ({
                        ...f,
                        solidsStartAgeMonths: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={feedingForm.vitaminDSupplement}
                      onChange={(e) =>
                        setFeedingForm((f) => ({
                          ...f,
                          vitaminDSupplement: e.target.checked,
                        }))
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    مكمل {t("pediatrics.vitaminD")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={feedingForm.ironSupplement}
                      onChange={(e) =>
                        setFeedingForm((f) => ({
                          ...f,
                          ironSupplement: e.target.checked,
                        }))
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    مكمل {t("pediatrics.iron")}
                  </label>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    ملاحظات التغذية
                  </label>
                  <textarea
                    rows={2}
                    value={feedingForm.notes}
                    onChange={(e) =>
                      setFeedingForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full border rounded p-2 bg-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveFeeding}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                حفظ بيانات التغذية
              </button>
            </div>
          </div>
        )}

        {/* 5. Pediatric Exam Tab */}
        {activeTab === "exam" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {t("pediatrics.examTitle")}
                </h3>
                <p className="text-xs text-gray-500">
                  الفحص السريري الممنهج لأجهزة الجسم مع قوالب سريعة للنتائج الطبيعية
                </p>
              </div>

              <button
                type="button"
                onClick={handleFillAllNormalExam}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {t("pediatrics.exam.allNormal")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.general")}
                </label>
                <input
                  type="text"
                  value={examForm.generalAppearance}
                  onChange={(e) =>
                    setExamForm((f) => ({
                      ...f,
                      generalAppearance: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.headNeck")}
                </label>
                <input
                  type="text"
                  value={examForm.headNeck}
                  onChange={(e) =>
                    setExamForm((f) => ({ ...f, headNeck: e.target.value }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.chest")}
                </label>
                <input
                  type="text"
                  value={examForm.respiratory}
                  onChange={(e) =>
                    setExamForm((f) => ({ ...f, respiratory: e.target.value }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.heart")}
                </label>
                <input
                  type="text"
                  value={examForm.cardiovascular}
                  onChange={(e) =>
                    setExamForm((f) => ({
                      ...f,
                      cardiovascular: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.abdomen")}
                </label>
                <input
                  type="text"
                  value={examForm.abdomen}
                  onChange={(e) =>
                    setExamForm((f) => ({ ...f, abdomen: e.target.value }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.neuro")}
                </label>
                <input
                  type="text"
                  value={examForm.neurological}
                  onChange={(e) =>
                    setExamForm((f) => ({ ...f, neurological: e.target.value }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("pediatrics.exam.skin")}
                </label>
                <input
                  type="text"
                  value={examForm.skin}
                  onChange={(e) =>
                    setExamForm((f) => ({ ...f, skin: e.target.value }))
                  }
                  className="w-full border rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveExam}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ الفحص الإكلينيكي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
