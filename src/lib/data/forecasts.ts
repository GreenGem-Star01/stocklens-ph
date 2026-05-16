import type { ForecastTrend } from "@/lib/types/stock";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

import { getAllStockAnalyses } from "@/lib/data/stocks";
import { isUpwardTrend } from "@/lib/forecast";

export type StockForecast = {
  ticker: string;
  company: string;
  sector: string;
  currentPrice: string;
  forecast7d: string;
  trend: ForecastTrend;
  accuracy: string;
  date: string;
  expectedChange?: string;
};

export type ModelPerformance = {
  model: string;
  avgMAE: string;
  avgRMSE: string;
  avgMAPE: string;
  avgAccuracy: string;
};

function parsePrice(value: string): number {
  const cleaned = value.replace(/[₱,\s]/g, "");
  return Number.parseFloat(cleaned) || 0;
}

function expectedChangePct(
  current: string,
  forecast: string,
): string | undefined {
  const from = parsePrice(current);
  const to = parsePrice(forecast);
  if (!from || !to) return undefined;
  const pct = ((to - from) / from) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function analysisToForecast(analysis: StockAnalysis): StockForecast {
  const { info, metrics, trend, forecastTarget, performance } = analysis;
  const expectedChange = expectedChangePct(
    metrics.lastClose,
    forecastTarget,
  );
  return {
    ticker: info.ticker,
    company: info.name.replace(/, Inc\.| Corporation/g, "").trim(),
    sector: info.sector,
    currentPrice: metrics.lastClose,
    forecast7d: forecastTarget,
    trend,
    accuracy: performance.directionalAccuracy,
    date: "2026-05-16",
    ...(expectedChange && trend !== "Mixed Signal"
      ? { expectedChange }
      : {}),
  };
}

export const allForecasts: StockForecast[] = getAllStockAnalyses()
  .filter((a) => a.info.ticker !== "PSEI.PS")
  .map(analysisToForecast);

export const modelPerformance: ModelPerformance[] = [
  {
    model: "LSTM",
    avgMAE: "1.45",
    avgRMSE: "1.82",
    avgMAPE: "1.05%",
    avgAccuracy: "65%",
  },
  {
    model: "Linear Regression",
    avgMAE: "1.89",
    avgRMSE: "2.35",
    avgMAPE: "1.38%",
    avgAccuracy: "59%",
  },
  {
    model: "Moving Average",
    avgMAE: "2.12",
    avgRMSE: "2.68",
    avgMAPE: "1.54%",
    avgAccuracy: "56%",
  },
  {
    model: "Naive Baseline",
    avgMAE: "2.58",
    avgRMSE: "3.25",
    avgMAPE: "1.87%",
    avgAccuracy: "51%",
  },
];

const upwardCount = allForecasts.filter((f) => isUpwardTrend(f.trend)).length;

export const forecastSummary = {
  totalToday: allForecasts.length,
  lastUpdated: "May 16, 2026",
  averageAccuracy: "64%",
  upwardCount,
  upwardPercent:
    allForecasts.length > 0
      ? `${Math.round((upwardCount / allForecasts.length) * 100)}%`
      : "0%",
};
