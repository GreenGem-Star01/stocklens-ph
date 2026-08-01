import { TICKER_BY_PATH, TICKER_BY_SYMBOL } from "@/lib/constants/tickers";
import type { ForecastTrend } from "@/lib/types/stock";

export const FORECAST_DISCLAIMER =
  "Forecasts are experimental and for educational purposes only. This is not financial advice.";

export function tickerToPath(ticker: string): string {
  return ticker.replace(/\.PS$/i, "").trim().toLowerCase();
}

export function pathToTicker(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper.includes(".PS")) {
    return TICKER_BY_SYMBOL[upper] ? upper : null;
  }

  const slug = trimmed.toLowerCase().replace(/\.ps$/i, "");
  return TICKER_BY_PATH[slug] ?? null;
}

export function getTrendBadgeVariant(
  trend: ForecastTrend,
): "default" | "destructive" | "secondary" {
  switch (trend) {
    case "Projected Upward":
      return "default";
    case "Projected Downward":
      return "destructive";
    case "Mixed Signal":
      return "secondary";
  }
}

export function isUpwardTrend(trend: ForecastTrend): boolean {
  return trend === "Projected Upward";
}

export function isDownwardTrend(trend: ForecastTrend): boolean {
  return trend === "Projected Downward";
}

export function trendFromPrices(last: number, target: number): ForecastTrend {
  if (!last) return "Mixed Signal";
  const delta = (target - last) / last;
  if (delta > 0.01) return "Projected Upward";
  if (delta < -0.01) return "Projected Downward";
  return "Mixed Signal";
}

/** Rounds to the same precision shown on screen (formatPriceAmount/PSEi
 * display) — trend classification must use this, not raw floats, so a price
 * that displays unchanged (e.g. ₱0.45 → ₱0.45) can never be labeled a
 * projected move the user can't actually see. Uses toFixed rather than
 * Math.round(x*100)/100: they disagree at exact half-cent floats (e.g.
 * 0.475 → toFixed "0.47", Math.round-based → 0.48) due to binary
 * floating-point representation, which reintroduces the exact display/trend
 * mismatch this function exists to prevent. */
export function roundToDisplayPrecision(value: number, isIndex = false): number {
  return isIndex ? Math.round(value) : Number(value.toFixed(2));
}
