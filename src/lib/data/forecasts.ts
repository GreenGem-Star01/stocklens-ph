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

export function expectedChangePct(
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

export type ModelMetricsLike = {
  model: string;
  mae: number;
  rmse: number;
  mape: number;
  dirAccuracy: number | null;
};

const MODEL_LABELS: Record<string, string> = {
  lstm: "LSTM",
  linear: "Linear Regression",
  ma: "Moving Average",
  naive: "Naive Baseline",
};

const MODEL_DISPLAY_ORDER = ["lstm", "linear", "ma", "naive"];

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Aggregates per-symbol stored model metrics (DB or snapshot rows) into the
 * portfolio-wide averages shown on the Model Performance tab. */
export function summarizeModelPerformance(
  rows: ModelMetricsLike[],
): ModelPerformance[] {
  const byModel = new Map<string, ModelMetricsLike[]>();
  for (const row of rows) {
    const list = byModel.get(row.model) ?? [];
    list.push(row);
    byModel.set(row.model, list);
  }

  const result: ModelPerformance[] = [];
  for (const model of MODEL_DISPLAY_ORDER) {
    const group = byModel.get(model);
    if (!group?.length) continue;
    const dirValues = group
      .map((r) => r.dirAccuracy)
      .filter((v): v is number => v != null);
    result.push({
      model: MODEL_LABELS[model] ?? model,
      avgMAE: average(group.map((r) => r.mae)).toFixed(2),
      avgRMSE: average(group.map((r) => r.rmse)).toFixed(2),
      avgMAPE: `${average(group.map((r) => r.mape)).toFixed(2)}%`,
      avgAccuracy: dirValues.length ? `${average(dirValues).toFixed(0)}%` : "—",
    });
  }
  return result;
}

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
