import {
  getStockAnalysisData,
  getStockHistoryData,
} from "@/lib/api/market-provider";
import type { StockAnalysis } from "@/lib/types/stock-analysis";
import type { BarRange } from "@/lib/market/types";

export async function getStockAnalysis(ticker: string): Promise<StockAnalysis> {
  const data = await getStockAnalysisData(ticker);
  if (!data) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }
  return data;
}

export async function getStockHistory(
  ticker: string,
  range: BarRange = "30d",
): Promise<StockAnalysis["chartData"]> {
  const points = await getStockHistoryData(ticker, range);
  if (!points) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }
  return points;
}
