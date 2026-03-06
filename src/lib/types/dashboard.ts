import type { MetricType, EntityType, SourceType } from "./database";

export interface KPIValue {
  gseb: number;
  competitor: number;
}

export interface KPIData {
  metric: MetricType;
  label: string;
  current: KPIValue;
  previous: KPIValue;
  deltaAbsolute: {
    gseb: number;
    competitor: number;
  };
  deltaPercent: {
    gseb: number;
    competitor: number;
  };
}

export interface BrandMetric {
  brand: string;
  entity: EntityType;
  value: number;
}

export interface BrandBreakdown {
  brand: string;
  entity: "gseb" | "competitor";
  currentValue: number;
  previousValue: number;
}

export interface OrganicPaidEntry {
  brand: string;
  entity: EntityType;
  source: SourceType;
  metric: MetricType;
  currentValue: number;
  previousValue: number;
  deltaAbsolute: number;
  deltaPercent: number;
}

export interface DashboardData {
  kpis: KPIData[];
  brandBreakdown: Record<MetricType, BrandBreakdown[]>;
  organicPaid: OrganicPaidEntry[];
  /** Period labels from Excel sheet tab names, keyed by year */
  periodLabels: Record<number, string>;
  /** Current year (most recent) */
  currentYear: number;
  /** Previous year */
  previousYear: number;
  lastUpload: {
    id: string;
    fileName: string;
    createdAt: string;
  } | null;
}
