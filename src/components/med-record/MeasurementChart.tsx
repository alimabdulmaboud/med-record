"use client";

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  Dot,
} from 'recharts';
import type { Measurement, MeasurementType } from '@/types/med-record';
import {
  formatTimeSeriesChartData,
  getVitalReferenceBands,
  type TimeSeriesPoint,
} from '@/lib/med-record/chart-formatter';

interface MeasurementChartProps {
  type: MeasurementType;
  measurements: Measurement[];
  context?: string;
  height?: number;
}

export function MeasurementChart({
  type,
  measurements,
  context,
  height = 280,
}: MeasurementChartProps) {
  const data = formatTimeSeriesChartData(type, measurements);
  const bands = getVitalReferenceBands(type, context);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
        <span>لا توجد قياسات مسجلة كافية لرسم المخطط البياني</span>
        <span className="text-[10px] mt-1 text-slate-400">سجل أول قراءة للبدء في تتبع المنحنى</span>
      </div>
    );
  }

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isAbnormal) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#e11d48"
          stroke="#fff"
          strokeWidth={2}
          className="animate-pulse"
        />
      );
    }
    return <circle cx={cx} cy={cy} r={3.5} fill="#10b981" stroke="#fff" strokeWidth={1.5} />;
  };

  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-xs" dir="ltr">
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="formattedDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as TimeSeriesPoint;
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-xl border border-slate-800 text-right" dir="rtl">
                      <div className="text-[10px] text-slate-400 mb-1">{pt.formattedDate}</div>
                      {type === 'blood_pressure' ? (
                        <div className="font-bold">
                          ضغط الدم: <span className="text-emerald-400">{pt.systolic} / {pt.diastolic} mmHg</span>
                        </div>
                      ) : (
                        <div className="font-bold">
                          القيمة: <span className="text-emerald-400">{pt.glucose ?? pt.value}</span>
                        </div>
                      )}
                      {pt.isAbnormal && (
                        <div className="mt-1 text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                          ⚠️ قراءة خارج النطاق الطبيعي
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Normal Range Reference Bands */}
            {bands.systolic && (
              <ReferenceArea
                y1={bands.systolic.min}
                y2={bands.systolic.max}
                fill="#10b981"
                fillOpacity={0.08}
              />
            )}
            {bands.glucose && (
              <ReferenceArea
                y1={bands.glucose.min}
                y2={bands.glucose.max}
                fill="#10b981"
                fillOpacity={0.08}
              />
            )}
            {bands.value && (
              <ReferenceArea
                y1={bands.value.min}
                y2={bands.value.max}
                fill="#10b981"
                fillOpacity={0.08}
              />
            )}

            {/* Lines */}
            {type === 'blood_pressure' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="الانقباضي"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={renderCustomDot}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="الانبساطي"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                />
              </>
            ) : type === 'blood_sugar' ? (
              <Line
                type="monotone"
                dataKey="glucose"
                name="السكر"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={renderCustomDot}
                activeDot={{ r: 6 }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2.5}
                dot={renderCustomDot}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Guide */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-2" dir="rtl">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>نطاق القراءات الطبيعية (Green Band)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span>قراءة غير طبيعية</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          منظمة الصحة العالمية / المعايير الطبية الدولية
        </div>
      </div>
    </div>
  );
}
