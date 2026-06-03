/** Y-axis domain and tick formatting for stock / index line charts (Recharts). */

function coerceNumeric(values: Array<number | string | null | undefined>): number[] {
  return values
    .map((v) => (typeof v === "number" ? v : v != null ? Number(v) : NaN))
    .filter((v) => Number.isFinite(v));
}

/**
 * Stable Y domain for price charts. Avoids tiny fractional spans that break Recharts ticks.
 */
export function stockChartYAxisDomain(
  values: Array<number | string | null | undefined>,
  options?: { isIndex?: boolean },
): [number, number] {
  const nums = coerceNumeric(values);
  if (nums.length === 0) return [0, 1];

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const isIndex = options?.isIndex ?? false;

  if (min === max) {
    const pad = isIndex
      ? Math.max(min * 0.002, 8)
      : Math.max(min * 0.02, 0.5);
    return [min - pad, max + pad];
  }

  const span = max - min;
  const pad = isIndex
    ? Math.max(span * 0.08, 12)
    : Math.max(span * 0.08, 0.25);

  if (isIndex) {
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }

  const lo = Math.floor((min - pad) * 100) / 100;
  const hi = Math.ceil((max + pad) * 100) / 100;
  return [lo, hi];
}

export function formatStockChartTick(
  value: number,
  options?: { isIndex?: boolean },
): string {
  if (!Number.isFinite(value)) return "";

  if (options?.isIndex) {
    return value.toLocaleString("en-PH", { maximumFractionDigits: 0 });
  }

  if (value >= 1000) {
    return value.toLocaleString("en-PH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
