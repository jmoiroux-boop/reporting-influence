"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";
import { formatCompact } from "@/lib/utils/format";
import type { BrandBreakdown } from "@/lib/types/dashboard";

interface BrandBarChartProps {
  data: BrandBreakdown[];
  title: string;
  subtitle?: string;
}

export function BrandBarChart({ data, title, subtitle }: BrandBarChartProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-seb-gray mt-0.5">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
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
                tickFormatter={(val) => formatCompact(val)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E0DB",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [
                  new Intl.NumberFormat("fr-FR").format(value as number),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />
              <Bar
                dataKey="gseb"
                name="Groupe SEB"
                fill={CHART_COLORS.gseb}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="competitor"
                name="Competitors"
                fill={CHART_COLORS.competitor}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
