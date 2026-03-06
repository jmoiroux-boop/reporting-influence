"use client";

import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { formatCompact, formatDeltaPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { METRIC_LABELS } from "@/lib/constants";
import type { OrganicPaidEntry } from "@/lib/types/dashboard";
import type { MetricType } from "@/lib/types/database";

interface OrganicPaidDetailProps {
  data: OrganicPaidEntry[];
  currentLabel: string;
  previousLabel: string;
}

export function OrganicPaidDetail({
  data,
  currentLabel,
  previousLabel,
}: OrganicPaidDetailProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>("influencers_activated");

  if (data.length === 0) return null;

  // Filter by selected metric
  const filtered = data.filter((d) => d.metric === selectedMetric);

  // Group by source (organic/paid)
  const organic = filtered.filter((d) => d.source === "organic");
  const paid = filtered.filter((d) => d.source === "paid");

  const renderTable = (entries: OrganicPaidEntry[]) => {
    if (entries.length === 0) {
      return (
        <p className="text-xs text-seb-gray-light py-3">Aucune donnée</p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-seb-gray">
                Marque
              </th>
              <th className="text-right py-2 px-3 font-medium text-seb-gray">
                {currentLabel}
              </th>
              <th className="text-right py-2 px-3 font-medium text-seb-gray">
                {previousLabel}
              </th>
              <th className="text-right py-2 pl-3 font-medium text-seb-gray">
                Variation
              </th>
            </tr>
          </thead>
          <tbody>
            {entries
              .sort((a, b) => b.currentValue - a.currentValue)
              .map((entry, idx) => (
                <tr
                  key={`${entry.brand}-${entry.entity}-${idx}`}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 pr-4 text-foreground font-medium">
                    {entry.brand}
                  </td>
                  <td className="text-right py-2 px-3 font-medium">
                    {formatCompact(entry.currentValue)}
                  </td>
                  <td className="text-right py-2 px-3 text-seb-gray">
                    {formatCompact(entry.previousValue)}
                  </td>
                  <td className="text-right py-2 pl-3">
                    <span
                      className={cn(
                        "font-medium",
                        entry.deltaPercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {formatDeltaPercent(entry.deltaPercent)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Metric tabs */}
      <div className="flex gap-1">
        {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetric === metric
                ? "bg-seb-red text-white"
                : "bg-seb-cream text-seb-gray hover:bg-seb-cream-dark"
            }`}
          >
            {METRIC_LABELS[metric]}
          </button>
        ))}
      </div>

      {/* Organic / Paid accordions */}
      <div className="space-y-3">
        <Accordion
          title={`Organic`}
          subtitle={`${organic.length} entrées`}
        >
          {renderTable(organic)}
        </Accordion>

        <Accordion
          title={`Paid`}
          subtitle={`${paid.length} entrées`}
        >
          {renderTable(paid)}
        </Accordion>
      </div>
    </div>
  );
}
