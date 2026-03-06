"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompact, formatDeltaPercent, formatDeltaAbsolute } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { KPIData } from "@/lib/types/dashboard";

interface KPICardProps {
  kpi: KPIData;
  previousLabel: string;
}

function DeltaIndicator({
  deltaAbs,
  deltaPct,
  previousLabel,
}: {
  deltaAbs: number;
  deltaPct: number;
  previousLabel: string;
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
      <span className="text-[10px] opacity-60 ml-0.5">
        vs {previousLabel}
      </span>
    </div>
  );
}

export function KPICard({ kpi, previousLabel }: KPICardProps) {
  return (
    <Card>
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <h3 className="text-sm font-semibold text-seb-gray">{kpi.label}</h3>

          {/* GSEB vs Competitors - side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* GSEB */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-seb-red" />
                <span className="text-xs font-medium text-seb-gray">
                  Groupe SEB
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCompact(kpi.current.gseb)}
              </p>
              <DeltaIndicator
                deltaAbs={kpi.deltaAbsolute.gseb}
                deltaPct={kpi.deltaPercent.gseb}
                previousLabel={previousLabel}
              />
            </div>

            {/* Competitors */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-seb-gray" />
                <span className="text-xs font-medium text-seb-gray">
                  Competitors
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCompact(kpi.current.competitor)}
              </p>
              <DeltaIndicator
                deltaAbs={kpi.deltaAbsolute.competitor}
                deltaPct={kpi.deltaPercent.competitor}
                previousLabel={previousLabel}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
