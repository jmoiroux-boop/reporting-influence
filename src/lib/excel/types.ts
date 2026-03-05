import type { MetricType, EntityType, SourceType } from "@/lib/types/database";

export interface ParsedRow {
  year: number;
  brand: string;
  metric: MetricType;
  entity: EntityType;
  source: SourceType;
  value: number;
  rawRowIndex: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  sheetNames: string[];
  years: number[];
  summary: Record<
    number,
    Record<MetricType, { gseb: number; competitor: number }>
  >;
}

export interface ValidationError {
  field: string;
  message: string;
}
