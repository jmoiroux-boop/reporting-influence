"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber, formatDeltaPercent, formatDeltaAbsolute } from "@/lib/utils/format";
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
          Comparaison {currentYear} vs {previousYear}
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
                <th className="text-right px-4 py-3 font-medium text-seb-gray">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-seb-red" />
                    GSEB {currentYear}
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-seb-gray">
                  GSEB {previousYear}
                </th>
                <th className="text-right px-4 py-3 font-medium text-seb-gray">
                  Delta
                </th>
                <th className="text-right px-4 py-3 font-medium text-seb-gray">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-seb-gray" />
                    Comp. {currentYear}
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-seb-gray">
                  Comp. {previousYear}
                </th>
                <th className="text-right px-6 py-3 font-medium text-seb-gray">
                  Delta
                </th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr
                  key={kpi.metric}
                  className="border-b border-border last:border-0 hover:bg-seb-cream/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {kpi.label}
                  </td>
                  <td className="text-right px-4 py-4 font-semibold text-foreground">
                    {formatNumber(kpi.current.gseb)}
                  </td>
                  <td className="text-right px-4 py-4 text-seb-gray">
                    {formatNumber(kpi.previous.gseb)}
                  </td>
                  <td className="text-right px-4 py-4">
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          kpi.deltaPercent.gseb >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {formatDeltaPercent(kpi.deltaPercent.gseb)}
                      </span>
                      <span className="text-[10px] text-seb-gray-light">
                        {formatDeltaAbsolute(kpi.deltaAbsolute.gseb)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-4 font-semibold text-foreground">
                    {formatNumber(kpi.current.competitor)}
                  </td>
                  <td className="text-right px-4 py-4 text-seb-gray">
                    {formatNumber(kpi.previous.competitor)}
                  </td>
                  <td className="text-right px-6 py-4">
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          kpi.deltaPercent.competitor >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {formatDeltaPercent(kpi.deltaPercent.competitor)}
                      </span>
                      <span className="text-[10px] text-seb-gray-light">
                        {formatDeltaAbsolute(kpi.deltaAbsolute.competitor)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
