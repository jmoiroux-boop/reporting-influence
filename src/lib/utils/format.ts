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
 * Format a delta absolute value with sign and thousands separators.
 */
export function formatDeltaAbsolute(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatNumber(delta)}`;
}

/**
 * Format a large number in compact form (e.g., 1.2M, 456K).
 */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}
