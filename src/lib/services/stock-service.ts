import { getStockAnalysisData, getStockHistoryData } from "@/lib/api/market-provider";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export async function getStockAnalysis(ticker: string): Promise<StockAnalysis> {
  const data = getStockAnalysisData(ticker);
  if (!data) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }
  return data;
}

export async function getStockHistory(
  ticker: string,
  range = "30d",
): Promise<StockAnalysis["chartData"]> {
  const points = getStockHistoryData(ticker, range);
  if (!points) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }
  return points;
}
