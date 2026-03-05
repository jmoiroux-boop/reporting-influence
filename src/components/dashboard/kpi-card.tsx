"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatDeltaPercent, formatDeltaAbsolute } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { KPIData } from "@/lib/types/dashboard";

interface KPICardProps {
  kpi: KPIData;
}

function DeltaIndicator({
  deltaAbs,
  deltaPct,
}: {
  deltaAbs: number;
  deltaPct: number;
}) {
  const isPositive = deltaPct > 0;
  const isNeutral = deltaPct === 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        isPositive && "bg-green-50 text-green-700",
        !isPositive && !isNeutral && "bg-red-50 text-red-700",
        isNeutral && "bg-gray-50 text-gray-600"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{formatDeltaPercent(deltaPct)}</span>
      <span className="text-[10px] opacity-70">
        ({formatDeltaAbsolute(deltaAbs)})
      </span>
    </div>
  );
}

export function KPICard({ kpi }: KPICardProps) {
  const totalCurrent = kpi.current.gseb + kpi.current.competitor;
  const totalPrevious = kpi.previous.gseb + kpi.previous.competitor;
  const totalDeltaPct =
    totalPrevious === 0
      ? totalCurrent === 0
        ? 0
        : 100
      : ((totalCurrent - totalPrevious) / totalPrevious) * 100;

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-seb-gray">{kpi.label}</h3>
            <DeltaIndicator
              deltaAbs={totalCurrent - totalPrevious}
              deltaPct={totalDeltaPct}
            />
          </div>

          {/* Total value */}
          <p className="text-3xl font-bold text-foreground">
            {formatNumber(totalCurrent)}
          </p>

          {/* GSEB vs Competitors */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            {/* GSEB */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-seb-red" />
                <span className="text-xs text-seb-gray">Groupe SEB</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {formatNumber(kpi.current.gseb)}
              </p>
              <DeltaIndicator
                deltaAbs={kpi.deltaAbsolute.gseb}
                deltaPct={kpi.deltaPercent.gseb}
              />
            </div>

            {/* Competitors */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-seb-gray" />
                <span className="text-xs text-seb-gray">Competitors</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {formatNumber(kpi.current.competitor)}
              </p>
              <DeltaIndicator
                deltaAbs={kpi.deltaAbsolute.competitor}
                deltaPct={kpi.deltaPercent.competitor}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
