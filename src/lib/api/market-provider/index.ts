import { isDbMarketEnabled, isDatabaseConnectionError } from "@/lib/db/config";
import { dbMarketProvider } from "@/lib/api/market-provider/db";
import { staticMarketProvider } from "@/lib/api/market-provider/static";
import type { MarketProvider } from "@/lib/api/market-provider/types";
import type { BarRange } from "@/lib/market/types";
import { getLatestQuotes } from "@/lib/market/quotes-repository";

let cachedProvider: MarketProvider | null = null;

let dbFallbackMeta: {
  usedFallback: boolean;
  fallbackReason: string | null;
} = {
  usedFallback: false,
  fallbackReason: null,
};

export function getDbFallbackMeta(): typeof dbFallbackMeta {
  return dbFallbackMeta;
}

export function resetDbFallbackMeta(): void {
  dbFallbackMeta = { usedFallback: false, fallbackReason: null };
}

export function getMarketProvider(): MarketProvider {
  if (!cachedProvider) {
    cachedProvider = isDbMarketEnabled()
      ? dbMarketProvider
      : staticMarketProvider;
  }
  return cachedProvider;
}

/** Reset provider (tests). */
export function resetMarketProvider(): void {
  cachedProvider = null;
  resetDbFallbackMeta();
}

export async function getStockAnalysisData(ticker: string) {
  return getMarketProvider().getStockAnalysis(ticker);
}

export async function getStockHistoryData(ticker: string, range: BarRange = "30d") {
  return getMarketProvider().getStockHistory(ticker, range);
}

export async function getMarketOverviewData() {
  resetDbFallbackMeta();

  if (!isDbMarketEnabled()) {
    return staticMarketProvider.getMarketOverview();
  }

  try {
    return await dbMarketProvider.getMarketOverview();
  } catch (err) {
    if (
      process.env.NODE_ENV === "development" &&
      isDatabaseConnectionError(err)
    ) {
      dbFallbackMeta = {
        usedFallback: true,
        fallbackReason:
          err instanceof Error ? err.message : "Database connection failed",
      };
      return staticMarketProvider.getMarketOverview();
    }
    throw err;
  }
}

export async function getForecastsData() {
  return getMarketProvider().getForecastsData();
}

export async function getQuotesForSymbols(symbols?: string[]) {
  if (isDbMarketEnabled()) {
    try {
      return await getLatestQuotes(symbols);
    } catch (err) {
      if (
        process.env.NODE_ENV === "development" &&
        isDatabaseConnectionError(err)
      ) {
        return staticMarketProvider.getLatestQuotes(symbols);
      }
      throw err;
    }
  }
  return getMarketProvider().getLatestQuotes(symbols);
}
