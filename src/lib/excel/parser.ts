import XLSX from "xlsx-js-style";
import type { MetricType, EntityType, SourceType } from "@/lib/types/database";
import type { ParsedRow, ParseResult } from "./types";
import { validateSheetNames } from "./validators";

/**
 * Detect if a cell has red font color.
 * SEB Red is #DD2D1F (or Excel red FF0000).
 * We check if the red channel is dominant (R > 150, G < 100, B < 100).
 */
function isRedFont(cell: XLSX.CellObject): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (cell as any)?.s;
  if (!style?.font?.color) return false;

  const color = style.font.color;

  // Handle direct RGB value
  const rgb = color.rgb;
  if (rgb) {
    // Normalize: ARGB (8 chars) → strip alpha, or RGB (6 chars)
    const hex = rgb.length === 8 ? rgb.substring(2) : rgb;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return r > 150 && g < 100 && b < 100;
  }

  // Handle theme-based colors: theme index for red is often not 0 or 1
  // Conservative: only direct RGB is trusted as red
  return false;
}

/**
 * Determine the source type from the cell label suffix.
 */
function getSourceType(label: string): SourceType | null {
  const trimmed = label.trim();
  if (trimmed.endsWith("All")) return "total";
  if (trimmed.endsWith("Organic")) return "organic";
  if (trimmed.endsWith("Paid")) return "paid";
  return null;
}

/**
 * Extract brand name from the cell label by removing the suffix.
 */
function extractBrand(label: string): string {
  const trimmed = label.trim();
  // Remove known suffixes and clean up
  return trimmed
    .replace(/\s+(All|Organic|Paid)$/i, "")
    .trim();
}

/**
 * Safely get numeric value from a cell.
 */
function numericValue(cell: XLSX.CellObject | undefined): number {
  if (!cell) return 0;
  const val = cell.v;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/[,\s]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Parse a single worksheet and extract influence data rows.
 */
function parseSheet(
  worksheet: XLSX.WorkSheet,
  year: number
): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const ref = worksheet["!ref"];
  if (!ref) return rows;

  const range = XLSX.utils.decode_range(ref);

  // Start from row 1 (skip header at row 0)
  for (let rowIdx = range.s.r + 1; rowIdx <= range.e.r; rowIdx++) {
    const cellA = worksheet[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })];
    if (!cellA || !cellA.v) continue;

    const label = String(cellA.v);
    const source = getSourceType(label);
    if (!source) continue;

    const brand = extractBrand(label);
    if (!brand) continue;

    const entity: EntityType = isRedFont(cellA) ? "gseb" : "competitor";

    // Column B = Activated Influencers
    const cellB = worksheet[XLSX.utils.encode_cell({ r: rowIdx, c: 1 })];
    // Column C = Engagement
    const cellC = worksheet[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })];
    // Column D = Video Views
    const cellD = worksheet[XLSX.utils.encode_cell({ r: rowIdx, c: 3 })];

    const metrics: { metric: MetricType; value: number }[] = [
      { metric: "influencers_activated", value: numericValue(cellB) },
      { metric: "engagement", value: numericValue(cellC) },
      { metric: "video_views", value: numericValue(cellD) },
    ];

    for (const { metric, value } of metrics) {
      rows.push({
        year,
        brand,
        metric,
        entity,
        source,
        value,
        rawRowIndex: rowIdx,
      });
    }
  }

  return rows;
}

/**
 * Build summary from parsed rows: aggregate per year/metric/entity.
 */
function buildSummary(
  rows: ParsedRow[]
): Record<number, Record<MetricType, { gseb: number; competitor: number }>> {
  const summary: Record<
    number,
    Record<MetricType, { gseb: number; competitor: number }>
  > = {};

  const metricKeys: MetricType[] = [
    "influencers_activated",
    "video_views",
    "engagement",
  ];

  for (const row of rows) {
    // Only aggregate "total" source (the "All" rows) for the executive summary
    if (row.source !== "total") continue;

    if (!summary[row.year]) {
      summary[row.year] = {} as Record<
        MetricType,
        { gseb: number; competitor: number }
      >;
      for (const m of metricKeys) {
        summary[row.year][m] = { gseb: 0, competitor: 0 };
      }
    }

    summary[row.year][row.metric][row.entity] += row.value;
  }

  return summary;
}

/**
 * Main parse function: takes an Excel file buffer and returns structured data.
 */
export function parseExcelFile(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellStyles: true,
  });

  const { years, errors } = validateSheetNames(workbook.SheetNames);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const allRows: ParsedRow[] = [];
  const sheetNames: string[] = [];
  const yearValues: number[] = [];

  for (const [year, sheetName] of years) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    sheetNames.push(sheetName);
    yearValues.push(year);

    const rows = parseSheet(worksheet, year);
    allRows.push(...rows);
  }

  return {
    rows: allRows,
    sheetNames,
    years: yearValues.sort(),
    summary: buildSummary(allRows),
  };
}
