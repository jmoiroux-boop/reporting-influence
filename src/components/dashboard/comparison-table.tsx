"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCompact, formatDeltaPercent, formatDeltaAbsolute } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { KPIData } from "@/lib/types/dashboard";

interface ComparisonTableProps {
  kpis: KPIData[];
  currentYear: number;
  previousYear: number;
}

export function ComparisonTable({
  kpis,
  currentYear,
  previousYear,
}: ComparisonTableProps) {
  if (kpis.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          GSEB vs Competitors — Comparaison par période
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-seb-cream/50">
                <th className="text-left px-6 py-3 font-medium text-seb-gray">
                  KPI
                </th>
                {/* T1 Current Year columns */}
                <th
                  colSpan={3}
                  className="text-center px-2 py-2 font-semibold text-seb-gray border-l border-border"
                >
                  T1 {currentYear}
                </th>
                {/* T1 Previous Year columns */}
                <th
                  colSpan={3}
                  className="text-center px-2 py-2 font-semibold text-seb-gray border-l border-border"
                >
                  T1 {previousYear}
                </th>
              </tr>
              <tr className="border-b border-border bg-seb-cream/30">
                <th className="text-left px-6 py-2 font-medium text-seb-gray" />
                {/* Current year sub-headers */}
                <th className="text-right px-4 py-2 font-medium text-seb-gray border-l border-border">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-seb-red" />
                    GSEB
                  </span>
                </th>
                <th className="text-right px-4 py-2 font-medium text-seb-gray">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-seb-gray" />
                    Comp.
                  </span>
                </th>
                <th className="text-right px-4 py-2 font-medium text-seb-gray">
                  Écart
                </th>
                {/* Previous year sub-headers */}
                <th className="text-right px-4 py-2 font-medium text-seb-gray border-l border-border">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-seb-red" />
                    GSEB
                  </span>
                </th>
                <th className="text-right px-4 py-2 font-medium text-seb-gray">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-seb-gray" />
                    Comp.
                  </span>
                </th>
                <th className="text-right px-6 py-2 font-medium text-seb-gray">
                  Écart
                </th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => {
                const currentDiff = kpi.current.gseb - kpi.current.competitor;
                const currentDiffPct =
                  kpi.current.competitor === 0
                    ? kpi.current.gseb === 0
                      ? 0
                      : 100
                    : ((kpi.current.gseb - kpi.current.competitor) / kpi.current.competitor) * 100;

                const previousDiff = kpi.previous.gseb - kpi.previous.competitor;
                const previousDiffPct =
                  kpi.previous.competitor === 0
                    ? kpi.previous.gseb === 0
                      ? 0
                      : 100
                    : ((kpi.previous.gseb - kpi.previous.competitor) / kpi.previous.competitor) * 100;

                return (
                  <tr
                    key={kpi.metric}
                    className="border-b border-border last:border-0 hover:bg-seb-cream/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {kpi.label}
                    </td>

                    {/* Current year: GSEB */}
                    <td className="text-right px-4 py-4 font-semibold text-foreground border-l border-border">
                      {formatCompact(kpi.current.gseb)}
                    </td>
                    {/* Current year: Competitors */}
                    <td className="text-right px-4 py-4 text-seb-gray">
                      {formatCompact(kpi.current.competitor)}
                    </td>
                    {/* Current year: Écart GSEB vs Comp */}
                    <td className="text-right px-4 py-4">
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            currentDiff >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {formatDeltaPercent(currentDiffPct)}
                        </span>
                        <span className="text-[10px] text-seb-gray-light">
                          {formatDeltaAbsolute(currentDiff)}
                        </span>
                      </div>
                    </td>

                    {/* Previous year: GSEB */}
                    <td className="text-right px-4 py-4 font-semibold text-foreground border-l border-border">
                      {formatCompact(kpi.previous.gseb)}
                    </td>
                    {/* Previous year: Competitors */}
                    <td className="text-right px-4 py-4 text-seb-gray">
                      {formatCompact(kpi.previous.competitor)}
                    </td>
                    {/* Previous year: Écart GSEB vs Comp */}
                    <td className="text-right px-6 py-4">
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            previousDiff >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {formatDeltaPercent(previousDiffPct)}
                        </span>
                        <span className="text-[10px] text-seb-gray-light">
                          {formatDeltaAbsolute(previousDiff)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
