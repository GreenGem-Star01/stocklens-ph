import { buildStockAnalysisFromSeed } from "@/lib/data/build-stock-analysis";
import { ALL_STOCK_SEEDS } from "@/lib/data/stock-seeds";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

const stockCatalog: Record<string, StockAnalysis> = Object.fromEntries(
  ALL_STOCK_SEEDS.map((seed) => [
    seed.ticker,
    buildStockAnalysisFromSeed(seed),
  ]),
);

export function getStockAnalysisStatic(ticker: string): StockAnalysis | null {
  return stockCatalog[ticker] ?? null;
}

export function getAllStockAnalyses(): StockAnalysis[] {
  return Object.values(stockCatalog);
}
