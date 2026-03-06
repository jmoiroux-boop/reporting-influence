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
  lastUpload: {
    id: string;
    fileName: string;
    createdAt: string;
  } | null;
}
