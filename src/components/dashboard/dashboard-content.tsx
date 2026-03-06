"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, FileSpreadsheet } from "lucide-react";
import { KPIGrid } from "./kpi-grid";
import { ComparisonTable } from "./comparison-table";
import { BrandBarChart } from "./brand-bar-chart";
import { OrganicPaidDetail } from "./organic-paid-detail";
import { CommentSection } from "./comment-section";
import { PageLoader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { METRIC_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DashboardData } from "@/lib/types/dashboard";
import type { MetricType } from "@/lib/types/database";

interface DashboardContentProps {
  isAdmin: boolean;
}

export function DashboardContent({ isAdmin }: DashboardContentProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>("influencers_activated");

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <PageLoader message="Chargement du dashboard..." />;
  }

  if (!data || data.kpis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-20 h-20 rounded-2xl bg-seb-cream-dark flex items-center justify-center">
          <FileSpreadsheet className="h-10 w-10 text-seb-gray-light" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Aucune donnée disponible
        </h3>
        <p className="text-sm text-seb-gray text-center max-w-md">
          {isAdmin
            ? "Importez un fichier Excel depuis la page Upload pour alimenter le dashboard."
            : "Les données n'ont pas encore été importées. Contactez un administrateur."}
        </p>
      </div>
    );
  }

  // Period labels from Excel sheet tab names
  const currentYear = data.currentYear;
  const previousYear = data.previousYear;
  const currentLabel = data.periodLabels[currentYear] || `${currentYear}`;
  const previousLabel = data.periodLabels[previousYear] || `${previousYear}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Executive Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 text-sm text-seb-gray">
              <Calendar className="h-3.5 w-3.5" />
              {currentLabel} vs {previousLabel}
            </div>
            {data.lastUpload && (
              <span className="text-xs text-seb-gray-light">
                Dernière mise à jour :{" "}
                {format(
                  new Date(data.lastUpload.createdAt),
                  "dd MMM yyyy HH:mm",
                  { locale: fr }
                )}
              </span>
            )}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5" />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <section>
        <KPIGrid kpis={data.kpis} previousLabel={previousLabel} />
        <CommentSection section="influencers_activated" isAdmin={isAdmin} />
      </section>

      {/* Comparison Table */}
      <section>
        <ComparisonTable
          kpis={data.kpis}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
        />
        <CommentSection section="engagement" isAdmin={isAdmin} />
      </section>

      {/* Brand Breakdown Charts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Breakdown par marque
          </h2>
          <div className="flex gap-1 ml-4">
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
        </div>
        <BrandBarChart
          data={data.brandBreakdown[selectedMetric] || []}
          title={METRIC_LABELS[selectedMetric]}
          subtitle={`${currentLabel} vs ${previousLabel} — GSEB vs Competitors`}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
        />
        <CommentSection section="brand_breakdown" isAdmin={isAdmin} />
      </section>

      {/* Organic vs Paid Detail */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Organic vs Paid
        </h2>
        <OrganicPaidDetail
          data={data.organicPaid}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
        />
        <CommentSection section="organic_paid" isAdmin={isAdmin} />
      </section>

      {/* Footer / Source */}
      <footer className="border-t border-border pt-6 pb-4 space-y-2 text-[11px] text-seb-gray-light leading-relaxed">
        <p>
          <span className="font-semibold text-seb-gray">Source:</span> Traackr
          Benchmark —{" "}
          <span className="font-semibold text-seb-gray">Scope:</span> FR, DE,
          IT, SP, UK, US | Krups, Moulinex, Tefal, Rowenta, Dreame, Shark,
          Ninja Kitchen, Philips (excluded Dyson).
        </p>
        <p>
          Please note that the benchmark on Traackr is updated on a monthly
          basis, as the underlying influencer database continuously evolves.
        </p>
      </footer>
    </div>
  );
}
