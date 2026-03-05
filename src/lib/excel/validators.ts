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
 */
export function validateSheetNames(
  sheetNames: string[]
): { years: Map<number, string>; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const years = new Map<number, string>();

  for (const name of sheetNames) {
    if (name.includes("2024")) {
      years.set(2024, name);
    }
    if (name.includes("2025")) {
      years.set(2025, name);
    }
  }

  if (!years.has(2024)) {
    errors.push({
      field: "sheets",
      message: `Onglet 2024 introuvable. Onglets présents : ${sheetNames.join(", ")}`,
    });
  }

  if (!years.has(2025)) {
    errors.push({
      field: "sheets",
      message: `Onglet 2025 introuvable. Onglets présents : ${sheetNames.join(", ")}`,
    });
  }

  return { years, errors };
}
