"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  GrowthIndicator,
  Sex,
  ChildGrowthProfile,
} from "@/modules/pediatrics/growth/types";
import {
  evaluateChildGrowth,
  generateGrowthCurves,
} from "@/modules/pediatrics/growth/engine";
import { t } from "@/lib/i18n";
import { Activity, Info, CheckCircle2, AlertTriangle } from "lucide-react";

interface GrowthChartProps {
  patientId: string;
  patientName: string;
  sex: Sex;
  birthDate: string;
  gestationalAgeWeeks?: number;
  currentWeightKg?: number;
  currentHeightCm?: number;
  currentHeadCircumferenceCm?: number;
  historicalMeasurements?: Array<{
    date: string;
    weightKg?: number | null;
    heightCm?: number | null;
    headCircumferenceCm?: number | null;
  }>;
}

export function GrowthChart({
  patientId,
  sex,
  birthDate,
  gestationalAgeWeeks,
  currentWeightKg,
  currentHeightCm,
  currentHeadCircumferenceCm,
  historicalMeasurements = [],
}: GrowthChartProps) {
  const [selectedIndicator, setSelectedIndicator] =
    useState<GrowthIndicator>("wfa");
  const [useCorrectedAge, setUseCorrectedAge] = useState<boolean>(true);

  const isPremature =
    typeof gestationalAgeWeeks === "number" &&
    gestationalAgeWeeks > 0 &&
    gestationalAgeWeeks < 37;

  // Evaluate latest current measurement
  const latestEvaluation: ChildGrowthProfile = useMemo(() => {
    return evaluateChildGrowth({
      patientId,
      sex,
      birthDate,
      gestationalAgeWeeks,
      weightKg: currentWeightKg,
      heightCm: currentHeightCm,
      headCircumferenceCm: currentHeadCircumferenceCm,
      useCorrectedAge,
    });
  }, [
    patientId,
    sex,
    birthDate,
    gestationalAgeWeeks,
    currentWeightKg,
    currentHeightCm,
    currentHeadCircumferenceCm,
    useCorrectedAge,
  ]);

  // Extract patient historical data points for the selected indicator
  const patientPoints = useMemo(() => {
    const points: Array<{ ageMonths: number; value: number }> = [];
    const bDate = new Date(birthDate);

    for (const m of historicalMeasurements) {
      const mDate = new Date(m.date);
      let diffDays = Math.max(
        0,
        Math.round((mDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (isPremature && useCorrectedAge && gestationalAgeWeeks) {
        const earlyDays = (40 - gestationalAgeWeeks) * 7;
        diffDays = Math.max(0, diffDays - earlyDays);
      }

      const ageMonths = Number((diffDays / 30.4375).toFixed(1));

      let val: number | undefined;
      if (selectedIndicator === "wfa" && typeof m.weightKg === "number") {
        val = m.weightKg;
      } else if (
        selectedIndicator === "lhfa" &&
        typeof m.heightCm === "number"
      ) {
        val = m.heightCm;
      } else if (
        selectedIndicator === "hcfa" &&
        typeof m.headCircumferenceCm === "number"
      ) {
        val = m.headCircumferenceCm;
      }

      if (val !== undefined && val > 0) {
        points.push({ ageMonths, value: val });
      }
    }

    // Add current measurement if not empty
    if (latestEvaluation) {
      const currentEval =
        selectedIndicator === "wfa"
          ? latestEvaluation.evaluations.weightForAge
          : selectedIndicator === "lhfa"
            ? latestEvaluation.evaluations.heightForAge
            : selectedIndicator === "hcfa"
              ? latestEvaluation.evaluations.headCircumferenceForAge
              : latestEvaluation.evaluations.bmiForAge;

      if (currentEval) {
        points.push({
          ageMonths: currentEval.ageMonths,
          value: currentEval.value,
        });
      }
    }

    return points;
  }, [
    historicalMeasurements,
    birthDate,
    isPremature,
    useCorrectedAge,
    gestationalAgeWeeks,
    selectedIndicator,
    latestEvaluation,
  ]);

  // Generate curves with patient points overlay
  const curveData = useMemo(() => {
    return generateGrowthCurves(selectedIndicator, sex, patientPoints);
  }, [selectedIndicator, sex, patientPoints]);

  const currentEval =
    selectedIndicator === "wfa"
      ? latestEvaluation.evaluations.weightForAge
      : selectedIndicator === "lhfa"
        ? latestEvaluation.evaluations.heightForAge
        : selectedIndicator === "hcfa"
          ? latestEvaluation.evaluations.headCircumferenceForAge
          : latestEvaluation.evaluations.bmiForAge;

  const unitLabel =
    selectedIndicator === "wfa"
      ? "كجم"
      : selectedIndicator === "bfa"
        ? "kg/m²"
        : "سم";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            {t("pediatrics.growthTitle")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            حساب الانحراف المعياري (Z-Score) والنسبة المئوية وفق جداول LMS لمنظمة الصحة العالمية
          </p>
        </div>

        {/* Indicator Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedIndicator("wfa")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedIndicator === "wfa"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("pediatrics.weightForAge")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIndicator("lhfa")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedIndicator === "lhfa"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("pediatrics.heightForAge")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIndicator("hcfa")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedIndicator === "hcfa"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("pediatrics.headCircumference")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIndicator("bfa")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedIndicator === "bfa"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("pediatrics.bmiForAge")}
          </button>
        </div>
      </div>

      {/* Prematurity & Corrected Age Alert */}
      {isPremature && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">طفل مبتسر (مولود في الأسبوع {gestationalAgeWeeks}): </span>
              <span>
                العمر الزمني: {latestEvaluation.chronologicalAgeMonths} شهر (
                {latestEvaluation.chronologicalAgeDays} يوم) · العمر المصحح:{" "}
                {latestEvaluation.correctedAgeMonths} شهر (
                {latestEvaluation.correctedAgeDays} يوم).
              </span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-950 shrink-0">
            <input
              type="checkbox"
              checked={useCorrectedAge}
              onChange={(e) => setUseCorrectedAge(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            {t("pediatrics.useCorrectedAge")}
          </label>
        </div>
      )}

      {/* Evaluation KPI Cards */}
      {currentEval ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div>
            <div className="text-xs text-gray-500">القيمة الحالية</div>
            <div className="text-base font-bold text-gray-900 mt-0.5">
              {currentEval.value} {unitLabel}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">الوسيط المرجعي (50%)</div>
            <div className="text-base font-bold text-gray-700 mt-0.5">
              {currentEval.median} {unitLabel}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">الانحراف المعياري (Z-Score)</div>
            <div
              className={`text-base font-bold mt-0.5 ${
                Math.abs(currentEval.zScore) <= 2
                  ? "text-emerald-700"
                  : currentEval.zScore < -2
                    ? "text-rose-600"
                    : "text-amber-600"
              }`}
            >
              {currentEval.zScore > 0 ? `+${currentEval.zScore}` : currentEval.zScore} SD
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">النسبة المئوية (Percentile)</div>
            <div className="text-base font-bold text-blue-700 mt-0.5">
              {currentEval.percentile}%
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded text-center">
          لم يتم إدخال قياس للمؤشر المحدد بعد لحساب الانحراف المعياري الحالي.
        </div>
      )}

      {/* Recharts Curve Visualization */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="ageMonths"
              unit=" ش"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              label={{
                value: "العمر بالشهور",
                position: "insideBottomRight",
                offset: -5,
                fontSize: 10,
                fill: "#9ca3af",
              }}
            />
            <YAxis
              unit={` ${unitLabel}`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(val: any, name: any) => [
                `${val} ${unitLabel}`,
                name === "patientValue"
                  ? "قياس الطفل"
                  : name === "median"
                    ? "الوسيط (Median)"
                    : name,
              ]}
              labelFormatter={(label) => `العمر: ${label} شهر`}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => {
                if (value === "patientValue") return "قياسات الطفل";
                if (value === "median") return "الوسيط الطبيعي (50%)";
                if (value === "sdNeg2" || value === "sdPos2") return "±2 انحراف معياري";
                if (value === "sdNeg3" || value === "sdPos3") return "±3 انحراف معياري";
                return value;
              }}
            />

            {/* Standard Reference Curves */}
            <Line
              type="monotone"
              dataKey="sdPos3"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              dot={false}
              name="+3 SD"
            />
            <Line
              type="monotone"
              dataKey="sdPos2"
              stroke="#fbbf24"
              strokeDasharray="3 3"
              dot={false}
              name="+2 SD"
            />
            <Line
              type="monotone"
              dataKey="median"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              name="median"
            />
            <Line
              type="monotone"
              dataKey="sdNeg2"
              stroke="#fbbf24"
              strokeDasharray="3 3"
              dot={false}
              name="-2 SD"
            />
            <Line
              type="monotone"
              dataKey="sdNeg3"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              dot={false}
              name="-3 SD"
            />

            {/* Patient Measurements */}
            <Line
              type="monotone"
              dataKey="patientValue"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
              connectNulls
              name="patientValue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
