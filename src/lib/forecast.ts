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
