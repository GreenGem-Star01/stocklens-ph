import {
  getForecastsData,
  getStockAnalysisData,
} from "@/lib/api/market-provider";
import type { StockForecast } from "@/lib/data/forecasts";
import { roundToDisplayPrecision, trendFromPrices } from "@/lib/forecast";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export type ForecastQuery = {
  ticker?: string;
  horizon?: string;
  model?: string;
};

export type ForecastResponse = {
  forecasts: StockForecast[];
  modelPerformance: Awaited<
    ReturnType<typeof getForecastsData>
  >["modelPerformance"];
};

export function buildForecastFromAnalysis(
  analysis: StockAnalysis,
  model = "linear",
): StockForecast {
  void model;
  const isIndex = analysis.info.sector === "Index";
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
    trend: trendFromPrices(
      roundToDisplayPrecision(lastPrice, isIndex),
      roundToDisplayPrecision(targetPrice, isIndex),
    ),
    accuracy: analysis.performance.directionalAccuracy,
    date: new Date().toISOString().slice(0, 10),
    expectedChange: analysis.metrics.dailyChange,
  };
}

export async function getForecasts(
  query: ForecastQuery = {},
): Promise<ForecastResponse> {
  const base = await getForecastsData();
  let items = base.forecasts;

  if (query.ticker) {
    const symbol = query.ticker.toUpperCase();
    const analysis = await getStockAnalysisData(symbol);
    if (analysis && query.model) {
      items = [buildForecastFromAnalysis(analysis, query.model)];
    } else {
      items = items.filter((f) => f.ticker === symbol);
    }
  }

  return { forecasts: items, modelPerformance: base.modelPerformance };
}
