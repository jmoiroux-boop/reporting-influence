"use client";

import { KPICard } from "./kpi-card";
import type { KPIData } from "@/lib/types/dashboard";

interface KPIGridProps {
  kpis: KPIData[];
}

export function KPIGrid({ kpis }: KPIGridProps) {
  if (kpis.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-seb-gray text-sm">
          Aucune donnée disponible. Veuillez importer un fichier Excel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpis.map((kpi) => (
        <KPICard key={kpi.metric} kpi={kpi} />
      ))}
    </div>
  );
}
