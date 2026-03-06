"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SEB_COLORS } from "@/lib/constants";
import { formatCompact, formatChartValue } from "@/lib/utils/format";
import type { BrandBreakdown } from "@/lib/types/dashboard";

interface BrandBarChartProps {
  data: BrandBreakdown[];
  title: string;
  subtitle?: string;
  currentYear: number;
  previousYear: number;
}

/** Colors for bars */
const COLORS = {
  gsebCurrent: SEB_COLORS.red,
  gsebPrevious: SEB_COLORS.redLight,
  competitorCurrent: SEB_COLORS.gray,
  competitorPrevious: SEB_COLORS.creamDark,
} as const;

/** Chart data row for Recharts */
interface ChartRow {
  brand: string;
  entity: "gseb" | "competitor";
  currentValue: number;
  previousValue: number;
}

/**
 * Custom tooltip showing only the brand name and the hovered bar value.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  // Show only entries with non-zero values
  const items = payload.filter((p: any) => p.value != null && p.value > 0);
  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {items.map((item: any, i: number) => (
        <p key={i} className="text-gray-600">
          <span
            className="inline-block w-2 h-2 rounded-sm mr-1.5"
            style={{ backgroundColor: item.color }}
          />
          {formatChartValue(item.value as number)}
        </p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Custom label for bars - shows value on top.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBarLabel(props: any) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const value = Number(props.value ?? 0);
  if (!value || value === 0) return null;

  const text = formatChartValue(value);

  return (
    <text
      x={x + width / 2}
      y={y - 4}
      fill="#726059"
      fontSize={9}
      textAnchor="middle"
      dominantBaseline="auto"
    >
      {text}
    </text>
  );
}

export function BrandBarChart({
  data,
  title,
  subtitle,
  currentYear,
  previousYear,
}: BrandBarChartProps) {
  // Prepare chart data
  const chartData: ChartRow[] = useMemo(() => {
    return data.map((d) => ({
      brand: d.brand,
      entity: d.entity,
      currentValue: d.currentValue,
      previousValue: d.previousValue,
    }));
  }, [data]);

  // Detect outliers: if max > 5x second-highest, cap Y-axis so smaller bars remain readable
  const yDomain = useMemo(() => {
    if (chartData.length < 2) return undefined;

    const allValues = chartData
      .flatMap((d) => [d.currentValue, d.previousValue])
      .filter((v) => v > 0)
      .sort((a, b) => b - a);

    if (allValues.length < 2) return undefined;

    const max = allValues[0];
    const secondMax = allValues[1];

    if (max > 5 * secondMax) {
      return [0, Math.ceil(secondMax * 1.8)] as [number, number];
    }

    return undefined;
  }, [chartData]);

  const hasOutlier = yDomain !== undefined;

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <p className="text-xs text-seb-gray mt-0.5">{subtitle}</p>
            )}
          </div>
          {hasOutlier && (
            <span className="text-[10px] text-seb-gray-light bg-seb-cream px-2 py-1 rounded-full">
              Échelle ajustée — valeurs sur les barres
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
              barGap={2}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E0DB"
                vertical={false}
              />
              <XAxis
                dataKey="brand"
                tick={{ fontSize: 11, fill: "#726059" }}
                axisLine={{ stroke: "#E5E0DB" }}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={70}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#726059" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => formatCompact(val)}
                domain={yDomain}
                allowDataOverflow={hasOutlier}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(114, 96, 89, 0.06)", radius: 4 }}
              />
              {/* Legend is rendered outside Recharts below */}

              {/* Current year bar */}
              <Bar
                dataKey="currentValue"
                name={`T1 ${currentYear}`}
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`current-${index}`}
                    fill={
                      entry.entity === "gseb"
                        ? COLORS.gsebCurrent
                        : COLORS.competitorCurrent
                    }
                  />
                ))}
                <LabelList
                  dataKey="currentValue"
                  content={renderBarLabel}
                />
              </Bar>

              {/* Previous year bar */}
              <Bar
                dataKey="previousValue"
                name={`T1 ${previousYear}`}
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`previous-${index}`}
                    fill={
                      entry.entity === "gseb"
                        ? COLORS.gsebPrevious
                        : COLORS.competitorPrevious
                    }
                  />
                ))}
                <LabelList
                  dataKey="previousValue"
                  content={renderBarLabel}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex items-center justify-center gap-6 pt-3 text-xs text-seb-gray">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.gsebCurrent }} />
            GSEB T1 {currentYear}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.gsebPrevious }} />
            GSEB T1 {previousYear}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.competitorCurrent }} />
            Comp. T1 {currentYear}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.competitorPrevious }} />
            Comp. T1 {previousYear}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
