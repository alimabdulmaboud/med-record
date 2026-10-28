"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import type { PersonMeasurement, MeasurementType } from "@/types/measurements";
import {
  transformMeasurementsToChartPoints,
  getVitalReferenceBands,
} from "./chart-utils";

interface MeasurementChartProps {
  type: MeasurementType;
  measurements: PersonMeasurement[];
  context?: string;
  height?: number;
}

export function MeasurementChart({
  type,
  measurements,
  context,
  height = 260,
}: MeasurementChartProps) {
  const points = transformMeasurementsToChartPoints(type, measurements);
  const bands = getVitalReferenceBands(
    type === "blood_glucose" ? ("blood_sugar" as any) : type,
    context
  );

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
        <span>لا توجد قراءات كافية لرسم المنحنى</span>
        <span className="text-[10px] mt-1 text-slate-400">سجل أول قراءة للبدء في تتبع الاتجاه</span>
      </div>
    );
  }

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isAbnormal) {
      return (
        <circle
          key={`dot-abnormal-${payload.id}`}
          cx={cx}
          cy={cy}
          r={5}
          fill="#e11d48"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return (
      <circle
        key={`dot-normal-${payload.id}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#0d9488"
        stroke="#fff"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div className="w-full" dir="ltr">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
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
                    className="bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs"
                    dir="rtl"
                  >
                    <p className="font-bold text-slate-500 mb-1">{data.formattedDate}</p>
                    {type === "blood_pressure" ? (
                      <p className="font-extrabold text-teal-700 dark:text-teal-400">
                        {data.systolic} / {data.diastolic} mmHg
                      </p>
                    ) : (
                      <p className="font-extrabold text-teal-700 dark:text-teal-400">
                        {data.value ?? data.glucose}
                      </p>
                    )}
                    {data.isAbnormal && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-rose-600">
                        قراءة خارج النطاق الطبيعي
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Reference bands for normal ranges */}
          {type === "blood_pressure" && bands.systolic && (
            <ReferenceArea
              y1={bands.systolic.min}
              y2={bands.systolic.max}
              fill="#10b981"
              fillOpacity={0.08}
            />
          )}
          {type === "blood_glucose" && bands.glucose && (
            <ReferenceArea
              y1={bands.glucose.min}
              y2={bands.glucose.max}
              fill="#10b981"
              fillOpacity={0.08}
            />
          )}

          {/* Lines */}
          {type === "blood_pressure" ? (
            <>
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={renderCustomDot}
                name="الانقباضي"
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6366f1" }}
                name="الانبساطي"
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={renderCustomDot}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
