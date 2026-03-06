"use client";

import { Accordion } from "@/components/ui/accordion";
import { formatCompact, formatDeltaPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { METRIC_LABELS } from "@/lib/constants";
import type { OrganicPaidEntry } from "@/lib/types/dashboard";

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
  if (data.length === 0) return null;

  // Group by source (organic/paid)
  const organic = data.filter((d) => d.source === "organic");
  const paid = data.filter((d) => d.source === "paid");

  const renderTable = (entries: OrganicPaidEntry[]) => {
    // Group by metric
    const byMetric: Record<string, OrganicPaidEntry[]> = {};
    for (const entry of entries) {
      if (!byMetric[entry.metric]) byMetric[entry.metric] = [];
      byMetric[entry.metric].push(entry);
    }

    return (
      <div className="space-y-6">
        {Object.entries(byMetric).map(([metric, metricEntries]) => (
          <div key={metric}>
            <h5 className="text-xs font-semibold text-seb-gray uppercase tracking-wide mb-3">
              {METRIC_LABELS[metric] || metric}
            </h5>
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
                  {metricEntries
                    .sort(
                      (a, b) =>
                        b.currentValue - a.currentValue
                    )
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Accordion
        title={`Organic ${currentLabel} vs ${previousLabel}`}
        subtitle={`${organic.length} entrées`}
      >
        {renderTable(organic)}
      </Accordion>

      <Accordion
        title={`Paid ${currentLabel} vs ${previousLabel}`}
        subtitle={`${paid.length} entrées`}
      >
        {renderTable(paid)}
      </Accordion>
    </div>
  );
}
