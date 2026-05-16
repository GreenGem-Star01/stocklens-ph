import { getForecastsData, getStockAnalysisData } from "@/lib/api/market-provider";
import type { StockForecast } from "@/lib/data/forecasts";
import type { ForecastTrend } from "@/lib/types/stock";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export type ForecastQuery = {
  ticker?: string;
  horizon?: string;
  model?: string;
};

export type ForecastResponse = {
  forecasts: StockForecast[];
  modelPerformance: ReturnType<typeof getForecastsData>["modelPerformance"];
};

function trendFromPrices(last: number, target: number): ForecastTrend {
  const delta = (target - last) / last;
  if (delta > 0.01) return "Projected Upward";
  if (delta < -0.01) return "Projected Downward";
  return "Mixed Signal";
}

export function buildForecastFromAnalysis(
  analysis: StockAnalysis,
  _model = "lstm",
): StockForecast {
  void _model;
  const lastPoint = [...analysis.chartData]
    .reverse()
    .find((p) => p.price != null);
  const forecastPoints = analysis.chartData.filter((p) => p.forecast != null);
  const lastPrice = lastPoint?.price ?? 0;
  const targetPrice = forecastPoints.at(-1)?.forecast ?? lastPrice;

  return {
    ticker: analysis.info.ticker,
    company: analysis.info.name,
    sector: analysis.info.sector,
    currentPrice: analysis.metrics.lastClose,
    forecast7d: analysis.forecastTarget,
    trend: trendFromPrices(lastPrice, targetPrice),
    accuracy: analysis.performance.directionalAccuracy,
    date: "2026-05-16",
    expectedChange: analysis.metrics.dailyChange,
  };
}

export async function getForecasts(
  query: ForecastQuery = {},
): Promise<ForecastResponse> {
  const base = getForecastsData();
  let items = base.forecasts;

  if (query.ticker) {
    const symbol = query.ticker.toUpperCase();
    const analysis = getStockAnalysisData(symbol);
    if (analysis && query.model) {
      items = [buildForecastFromAnalysis(analysis, query.model)];
    } else {
      items = items.filter((f) => f.ticker === symbol);
    }
  }

  return { forecasts: items, modelPerformance: base.modelPerformance };
}
