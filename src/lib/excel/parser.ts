import type { MetricType, EntityType, SourceType } from "@/lib/types/database";
import type { ParsedRow, ParseResult } from "./types";
import { validateSheetNames } from "./validators";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Build a mapping of style index → isRed (GSEB) using workbook Styles.
 * wb.Styles.Fonts contains font definitions with color.rgb.
 * wb.Styles.CellXf contains cellXf entries with fontId.
 * A cell is "red" (GSEB) if its CellXf's fontId points to a red font.
 */
function buildRedStyleMap(wb: any): Set<number> {
  const redXfIndexes = new Set<number>();

  if (!wb.Styles?.Fonts || !wb.Styles?.CellXf) return redXfIndexes;

  const fonts: any[] = wb.Styles.Fonts;
  const cellXfs: any[] = wb.Styles.CellXf;

  // Find which fontIds are red
  const redFontIds = new Set<number>();
  fonts.forEach((font, idx) => {
    const rgb = font?.color?.rgb;
    if (rgb) {
      const hex = rgb.length === 8 ? rgb.substring(2) : rgb;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (r > 150 && g < 100 && b < 100) {
        redFontIds.add(idx);
      }
    }
  });

  // Map CellXf index → isRed
  cellXfs.forEach((xf, idx) => {
    const fontId = parseInt(xf.fontId || xf.fontid || "0");
    if (redFontIds.has(fontId)) {
      redXfIndexes.add(idx);
    }
  });

  return redXfIndexes;
}

/**
 * Parse the raw XML of a sheet from the XLSX ZIP to extract
 * the numeric style index (`s` attribute) for each cell.
 * Returns a map: cellRef (e.g. "A2") → style index number.
 */
function parseSheetXmlStyleIndexes(sheetXml: string): Map<string, number> {
  const styleMap = new Map<string, number>();
  // Match <c r="A2" s="6" ...> or <c r="A2" ...> (no s means s=0)
  const cellPattern = /<c\s+r="([A-Z]+\d+)"(?:\s+s="(\d+)")?[^>]*>/g;
  let match;
  while ((match = cellPattern.exec(sheetXml)) !== null) {
    const ref = match[1];
    const styleIdx = match[2] ? parseInt(match[2]) : 0;
    styleMap.set(ref, styleIdx);
  }
  return styleMap;
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
 * Handles labels like "All-Clad- All" or "Moulinex- Organic".
 */
function extractBrand(label: string): string {
  const trimmed = label.trim();
  return trimmed
    .replace(/[-\s]+(All|Organic|Paid)$/i, "")
    .trim();
}

/**
 * Safely get numeric value from a cell.
 */
function numericValue(cell: any): number {
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
 * Uses style index mapping from raw XML + CellXf font detection.
 */
function parseSheet(
  XLSX: any,
  worksheet: any,
  year: number,
  styleIndexMap: Map<string, number>,
  redStyleIndexes: Set<number>
): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const ref = worksheet["!ref"];
  if (!ref) return rows;

  const range = XLSX.utils.decode_range(ref);

  for (let rowIdx = range.s.r + 1; rowIdx <= range.e.r; rowIdx++) {
    const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
    const cellA = worksheet[cellRef];
    if (!cellA || !cellA.v) continue;

    const label = String(cellA.v);
    const source = getSourceType(label);
    if (!source) continue;

    const brand = extractBrand(label);
    if (!brand) continue;

    // Detect GSEB vs Competitor using raw style index from XML
    const rawStyleIdx = styleIndexMap.get(cellRef) ?? 0;
    const entity: EntityType = redStyleIndexes.has(rawStyleIdx)
      ? "gseb"
      : "competitor";

    const cellB = worksheet[XLSX.utils.encode_cell({ r: rowIdx, c: 1 })];
    const cellC = worksheet[XLSX.utils.encode_cell({ r: rowIdx, c: 2 })];
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
 * Build summary from parsed rows.
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
 * Uses:
 *  - xlsx-js-style for cell values + Styles (Fonts, CellXf)
 *  - jszip to extract raw XML and get cell style indexes
 * This two-pass approach is needed because xlsx-js-style doesn't expose
 * the raw style index (it replaces it with the fill pattern object).
 */
export async function parseExcelFile(buffer: Buffer): Promise<ParseResult> {
  // Dynamic imports to avoid bundler issues with __dirname
  const XLSX =
    (await import("xlsx-js-style")).default ||
    (await import("xlsx-js-style"));
  const JSZip = (await import("jszip")).default || (await import("jszip"));

  // 1. Parse with xlsx-js-style for cell values + Styles metadata
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellStyles: true,
  });

  // 2. Build the red style index set from wb.Styles
  const redStyleIndexes = buildRedStyleMap(workbook);

  // 3. Parse the XLSX ZIP to extract raw sheet XML (for style indexes)
  const zip = await JSZip.loadAsync(buffer);

  const { years, errors } = validateSheetNames(workbook.SheetNames);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const allRows: ParsedRow[] = [];
  const sheetNames: string[] = [];
  const yearValues: number[] = [];

  for (const [year, sheetName] of years.entries()) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    sheetNames.push(sheetName);
    yearValues.push(year);

    // Find the corresponding sheet XML file in the ZIP
    // Sheets are typically named sheet1.xml, sheet2.xml, etc.
    // The order matches workbook.SheetNames order via workbook.xml rels
    const sheetIndex = workbook.SheetNames.indexOf(sheetName) + 1;
    const sheetXmlFile = zip.file(`xl/worksheets/sheet${sheetIndex}.xml`);

    let styleIndexMap = new Map<string, number>();
    if (sheetXmlFile) {
      const sheetXml = await sheetXmlFile.async("string");
      styleIndexMap = parseSheetXmlStyleIndexes(sheetXml);
    }

    const rows = parseSheet(XLSX, worksheet, year, styleIndexMap, redStyleIndexes);
    allRows.push(...rows);
  }

  return {
    rows: allRows,
    sheetNames,
    years: yearValues.sort(),
    summary: buildSummary(allRows),
  };
}
