"use client";

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { GrowthMeasurement, Gender } from '@/types/med-record';
import { generateWHOGrowthCurveData } from '@/lib/med-record/chart-formatter';
import { Scale, Ruler, Baby } from 'lucide-react';

interface GrowthPercentileChartProps {
  sex: Gender;
  childName: string;
  records: GrowthMeasurement[];
}

export function GrowthPercentileChart({
  sex,
  childName,
  records,
}: GrowthPercentileChartProps) {
  const [metric, setMetric] = useState<'weight' | 'height' | 'head_circumference'>('weight');

  const curveData = generateWHOGrowthCurveData(metric, sex, records);

  const getMetricLabels = () => {
    switch (metric) {
      case 'weight':
        return { title: 'الوزن بالنسبة للعمر (Weight-for-age)', unit: 'كجم (kg)', icon: Scale };
      case 'height':
        return { title: 'الطول / القامة بالنسبة للعمر (Height-for-age)', unit: 'سم (cm)', icon: Ruler };
      case 'head_circumference':
        return { title: 'محيط الرأس بالنسبة للعمر (Head Circumference)', unit: 'سم (cm)', icon: Baby };
    }
  };

  const { title, unit, icon: Icon } = getMetricLabels();

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4" dir="rtl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            مخطط منظمة الصحة العالمية الرسمي (WHO Growth Standards) من الولادة حتى 5 سنوات
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMetric('weight')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              metric === 'weight'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الوزن
          </button>
          <button
            onClick={() => setMetric('height')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              metric === 'height'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الطول
          </button>
          <button
            onClick={() => setMetric('head_circumference')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              metric === 'head_circumference'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            محيط الرأس
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-72 sm:h-80" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="ageMonths"
              stroke="#94a3b8"
              fontSize={11}
              unit="m"
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl text-right" dir="rtl">
                      <div className="text-[10px] text-purple-300 font-bold mb-1">
                        العمر: {pt.ageMonths} أشهر
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>المتوسط (النسبة 50%): <span className="font-bold text-white">{pt.p50} {unit}</span></div>
                        <div className="text-slate-400">الحد الأدنى (3%): {pt.p3} {unit}</div>
                        <div className="text-slate-400">الحد الأقصى (97%): {pt.p97} {unit}</div>
                        {pt.patientValue !== undefined && (
                          <div className="mt-1 pt-1 border-t border-slate-700 font-bold text-emerald-400">
                            قراءة {childName}: {pt.patientValue} {unit}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* WHO Standard Percentiles Lines */}
            <Line type="monotone" dataKey="p97" name="النسبة 97" stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="p85" name="النسبة 85" stroke="#94a3b8" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="p50" name="المتوسط الطبيعي (50%)" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="p15" name="النسبة 15" stroke="#94a3b8" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="p3" name="النسبة 3" stroke="#cbd5e1" strokeWidth={1} dot={false} strokeDasharray="3 3" />

            {/* Patient Actual Trajectory */}
            <Line
              type="monotone"
              dataKey="patientValue"
              name={`قراءات ${childName}`}
              stroke="#059669"
              strokeWidth={3}
              dot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Percentiles Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-purple-600 rounded-full" />
            <span className="font-bold text-slate-700">الخط البنفسجي: المتوسط الطبيعي لمنظمة الصحة (P50)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border-2 border-white shadow-xs" />
            <span className="font-bold text-emerald-700">النقاط الخضراء: قراءات طفلك الفعلية</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          النطاق بين P3 و P97 يمثل 94% من الأطفال الأصحاء عالمياً
        </div>
      </div>
    </div>
  );
}
