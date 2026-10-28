"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PersonMeasurement } from "@/types/measurements";
import type { Sex } from "@/types/family";
import { transformGrowthToWHOCurves } from "./chart-utils";
import { Scale, Ruler, Baby } from "lucide-react";

interface GrowthChartProps {
  sex: Sex;
  childName: string;
  records: PersonMeasurement[];
}

export function GrowthChart({ sex, childName, records }: GrowthChartProps) {
  const [metric, setMetric] = useState<"weight" | "height" | "head_circumference">("weight");

  const curveData = transformGrowthToWHOCurves(metric, sex, records);

  const getMetricInfo = () => {
    switch (metric) {
      case "weight":
        return { title: "الوزن بالنسبة للعمر", unit: "كجم (kg)", icon: Scale };
      case "height":
        return { title: "الطول بالنسبة للعمر", unit: "سم (cm)", icon: Ruler };
      case "head_circumference":
        return { title: "محيط الرأس بالنسبة للعمر", unit: "سم (cm)", icon: Baby };
    }
  };

  const { title, unit, icon: Icon } = getMetricInfo();

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4" dir="rtl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            مخطط منظمة الصحة العالمية (WHO Growth Standards) من الولادة حتى 5 سنوات
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          {[
            { id: "weight", label: "الوزن" },
            { id: "height", label: "الطول" },
            { id: "head_circumference", label: "محيط الرأس" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                metric === m.id
                  ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis
              dataKey="ageMonths"
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
              label={{ value: "العمر بالشهور", position: "insideBottom", offset: -5, fontSize: 10, fill: "#94a3b8" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div
                      className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs"
                      dir="rtl"
                    >
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                        العمر: {data.ageMonths} شهر
                      </p>
                      {data.childValue !== undefined && (
                        <p className="font-extrabold text-purple-600 text-sm mb-1">
                          قياس {childName}: {data.childValue} {unit}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>الوسيط (P50): {data.p50}</span>
                        <span>الحد الأعلى (P97): {data.p97}</span>
                        <span>الحد الأدنى (P3): {data.p3}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* WHO Percentile Curves (Gray/Muted) */}
            <Line type="monotone" dataKey="p97" stroke="#cbd5e1" strokeDasharray="3 3" dot={false} strokeWidth={1} name="97%" />
            <Line type="monotone" dataKey="p85" stroke="#94a3b8" strokeDasharray="2 2" dot={false} strokeWidth={1} name="85%" />
            <Line type="monotone" dataKey="p50" stroke="#059669" dot={false} strokeWidth={1.5} name="50% (متوسط)" />
            <Line type="monotone" dataKey="p15" stroke="#94a3b8" strokeDasharray="2 2" dot={false} strokeWidth={1} name="15%" />
            <Line type="monotone" dataKey="p3" stroke="#cbd5e1" strokeDasharray="3 3" dot={false} strokeWidth={1} name="3%" />

            {/* Child's Recorded Values (Solid Purple Points) */}
            <Line
              type="monotone"
              dataKey="childValue"
              stroke="#7c3aed"
              strokeWidth={3}
              connectNulls
              dot={{ r: 5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
              name={childName}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Advice */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            <span>قياسات الطفل الفعلية</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" />
            <span>متوسط منظمة الصحة (P50)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b border-dashed border-slate-400 inline-block" />
            <span>النطاق الطبيعي (P3 - P97)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
