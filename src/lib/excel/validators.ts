import { UPLOAD_LIMITS } from "@/lib/constants";
import type { ValidationError } from "./types";

/**
 * Validate uploaded file MIME type and size.
 */
export function validateFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check MIME type
  if (!(UPLOAD_LIMITS.allowedMimeTypes as readonly string[]).includes(file.type)) {
    errors.push({
      field: "file",
      message: `Type de fichier invalide. Seuls les fichiers .xlsx sont acceptés. Type reçu : ${file.type || "inconnu"}`,
    });
  }

  // Check extension
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!(UPLOAD_LIMITS.allowedExtensions as readonly string[]).includes(ext)) {
    errors.push({
      field: "file",
      message: `Extension invalide : ${ext}. Seul .xlsx est accepté.`,
    });
  }

  // Check size
  if (file.size > UPLOAD_LIMITS.maxFileSize) {
    const maxMB = UPLOAD_LIMITS.maxFileSize / (1024 * 1024);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push({
      field: "file",
      message: `Fichier trop volumineux (${fileMB} MB). Maximum : ${maxMB} MB.`,
    });
  }

  return errors;
}

/**
 * Validate that the workbook has sheets containing year indicators.
 * Dynamically detects years from sheet names (e.g. "Trimestre 1 2025", "Full Year 2024").
 * Expects exactly 2 sheets with consecutive years.
 */
export function validateSheetNames(
  sheetNames: string[]
): { years: Map<number, string>; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const years = new Map<number, string>();

  // Extract all 4-digit years from sheet names
  const yearPattern = /\b(20\d{2})\b/;
  for (const name of sheetNames) {
    const match = name.match(yearPattern);
    if (match) {
      const year = parseInt(match[1]);
      years.set(year, name);
    }
  }

  if (years.size < 2) {
    errors.push({
      field: "sheets",
      message: `Au moins 2 onglets avec des années différentes sont requis. Onglets trouvés : ${sheetNames.join(", ")}`,
    });
  }

  // Verify that the two years are consecutive (N and N-1)
  if (years.size >= 2) {
    const sortedYears = [...years.keys()].sort((a, b) => b - a);
    const [currentYear, previousYear] = sortedYears;
    if (currentYear - previousYear !== 1) {
      errors.push({
        field: "sheets",
        message: `Les années doivent être consécutives (ex: 2025 et 2024). Trouvées : ${sortedYears.join(", ")}`,
      });
    }
  }

  return { years, errors };
}
