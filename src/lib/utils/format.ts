/**
 * Format a number with thousands separators and optional decimal places.
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Calculate absolute delta between current and previous values.
 */
export function deltaAbsolute(current: number, previous: number): number {
  return current - previous;
}

/**
 * Calculate percentage delta between current and previous values.
 * Returns 0 if previous is 0 (avoid division by zero).
 */
export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

/**
 * Format a delta percentage with sign and 1 decimal.
 */
export function formatDeltaPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Format a delta absolute value with sign and compact format.
 */
export function formatDeltaAbsolute(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatCompact(delta)}`;
}

/**
 * Format a large number in compact form for Y-axis ticks.
 * Uses "k" suffix with french-style separators for values >= 100 000.
 * Examples:
 *   14 000 000 → "14 000k"
 *   1 246 306  → "1 246k"
 *   150 000    → "150k"
 *   99 000     → "99 000"
 *   227        → "227"
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000) {
    const inK = Math.round(value / 1_000);
    return `${formatNumber(inK)}k`;
  }
  return formatNumber(Math.round(value));
}

/**
 * Format a number for chart labels/tooltips.
 * Same logic as formatCompact but always with french thousands separators.
 */
export function formatChartValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000) {
    const inK = Math.round(value / 1_000);
    return `${formatNumber(inK)}k`;
  }
  return formatNumber(Math.round(value));
}
