import {
  featuredStocks,
  marketOverview,
  pseiData,
  recentAnalysis,
} from "@/lib/data/dashboard";
import {
  allForecasts,
  forecastSummary,
  modelPerformance,
} from "@/lib/data/forecasts";
import { getStockAnalysisStatic } from "@/lib/data/stocks";
import { TICKER_BY_SYMBOL } from "@/lib/constants/tickers";
import type { StockForecast } from "@/lib/data/forecasts";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function getMarketOverviewData() {
  return {
    overview: marketOverview,
    featured: featuredStocks,
    pseiChart: pseiData,
    recent: recentAnalysis,
  };
}

export function getStockAnalysisData(ticker: string): StockAnalysis | null {
  const normalized = ticker.toUpperCase().includes(".PS")
    ? ticker.toUpperCase()
    : `${ticker.toUpperCase()}.PS`;
  if (!TICKER_BY_SYMBOL[normalized]) return null;
  return getStockAnalysisStatic(normalized) ?? null;
}

export function getStockHistoryData(
  ticker: string,
  range = "30d",
): StockAnalysis["chartData"] | null {
  void range;
  const analysis = getStockAnalysisData(ticker);
  return analysis?.chartData ?? null;
}

export function getForecastsData(): {
  forecasts: StockForecast[];
  modelPerformance: typeof modelPerformance;
  summary: typeof forecastSummary;
} {
  return {
    forecasts: allForecasts,
    modelPerformance,
    summary: forecastSummary,
  };
}
