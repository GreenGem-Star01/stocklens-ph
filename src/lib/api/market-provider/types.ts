import type { ModelPerformance, StockForecast } from "@/lib/data/forecasts";
import type { forecastSummary } from "@/lib/data/forecasts";
import type {
  FeaturedStock,
  PseiDataPoint,
  RecentAnalysisRow,
} from "@/lib/types/stock";
import type { MarketQuote } from "@/lib/market/types";
import type { BarRange, MarketBar } from "@/lib/market/types";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export type MarketOverviewPayload = {
  overview: {
    pseiValue: string;
    pseiChange: string;
    topGainer: { ticker: string; change: string };
    topLoser: { ticker: string; change: string };
    marketStatus: string;
    marketCloseNote: string;
  };
  featured: FeaturedStock[];
  pseiChart: PseiDataPoint[];
  recent: RecentAnalysisRow[];
  quotesAsOf?: string | null;
  stale?: boolean;
};

export type ForecastsPayload = {
  forecasts: StockForecast[];
  modelPerformance: ModelPerformance[];
  summary: typeof forecastSummary;
};

export interface MarketProvider {
  getLatestQuotes(symbols?: string[]): Promise<Map<string, MarketQuote>>;
  getBars(ticker: string, range: BarRange): Promise<MarketBar[]>;
  getStockAnalysis(ticker: string): Promise<StockAnalysis | null>;
  getStockHistory(
    ticker: string,
    range: BarRange,
  ): Promise<StockAnalysis["chartData"] | null>;
  getMarketOverview(): Promise<MarketOverviewPayload>;
  getForecastsData(): Promise<ForecastsPayload>;
}
