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
import { buildMarketAnalysis } from "@/lib/data/build-market-analysis";
import { getAllForecastsFromSnapshot } from "@/lib/market/forecasts-snapshot";
import { getPseCompanyByTicker } from "@/lib/pse/universe";
import { TICKER_BY_SYMBOL } from "@/lib/constants/tickers";
import type { MarketProvider } from "@/lib/api/market-provider/types";
import {
  formatAsOf,
  formatChangePct,
  isQuoteStale,
  quoteToDisplay,
} from "@/lib/market/format-quote";
import { mergePseiQuoteIntoChartPoints } from "@/lib/market/psei-chart";
import { applyMarketSession } from "@/lib/market/pse-session";
import {
  getQuotesSnapshot,
  getQuotesSnapshotAsOf,
} from "@/lib/market/quotes-snapshot";
import { symbolToTicker, tickerToSymbol } from "@/lib/market/symbol";
import type { BarRange, MarketQuote } from "@/lib/market/types";
import type { FeaturedStock, RecentAnalysisRow } from "@/lib/types/stock";

function normalizeTicker(ticker: string): string {
  return ticker.toUpperCase().includes(".PS")
    ? ticker.toUpperCase()
    : `${ticker.toUpperCase()}.PS`;
}

function filterQuotes(
  all: Map<string, MarketQuote>,
  symbols?: string[],
): Map<string, MarketQuote> {
  if (!symbols?.length) return all;
  const out = new Map<string, MarketQuote>();
  for (const ticker of symbols) {
    const symbol = tickerToSymbol(ticker);
    const quote = all.get(symbol);
    if (quote) out.set(symbol, quote);
  }
  return out;
}

function buildFeaturedFromQuotes(quotes: Map<string, MarketQuote>): FeaturedStock[] {
  return featuredStocks.map((seed) => {
    const quote = quotes.get(tickerToSymbol(seed.ticker));
    if (!quote) return seed;
    const isIndex = seed.sector === "Index";
    const display = quoteToDisplay(quote, isIndex);
    return {
      ...seed,
      price: display.lastClose,
      change: display.dailyChange,
      direction: display.direction,
      positive: display.direction === "up",
    };
  });
}

function buildRecentFromQuotes(
  quotes: Map<string, MarketQuote>,
): RecentAnalysisRow[] {
  return recentAnalysis.map((row) => {
    const quote = quotes.get(tickerToSymbol(row.ticker));
    if (!quote) return row;
    const display = quoteToDisplay(quote, row.ticker === "PSEI.PS");
    return {
      ...row,
      close: display.lastClose,
      updated: formatAsOf(quote.asOf),
    };
  });
}

function overviewFromQuotes(quotes: Map<string, MarketQuote>) {
  let topGainer = marketOverview.topGainer;
  let topLoser = marketOverview.topLoser;
  let bestPct = -Infinity;
  let worstPct = Infinity;

  for (const [symbol, quote] of quotes) {
    if (quote.changePct > bestPct) {
      bestPct = quote.changePct;
      topGainer = {
        ticker: symbolToTicker(symbol),
        change: formatChangePct(quote.changePct),
      };
    }
    if (quote.changePct < worstPct) {
      worstPct = quote.changePct;
      topLoser = {
        ticker: symbolToTicker(symbol),
        change: formatChangePct(quote.changePct),
      };
    }
  }

  const psei = quotes.get("PSEI");
  return applyMarketSession({
    ...marketOverview,
    pseiValue: psei
      ? quoteToDisplay(psei, true).lastClose
      : marketOverview.pseiValue,
    pseiChange: psei
      ? quoteToDisplay(psei, true).dailyChange
      : marketOverview.pseiChange,
    topGainer,
    topLoser,
  });
}

function snapshotQuotes(symbols?: string[]): Map<string, MarketQuote> {
  const all = getQuotesSnapshot();
  if (!all) return new Map();
  return filterQuotes(all, symbols);
}

export const staticMarketProvider: MarketProvider = {
  async getLatestQuotes(symbols) {
    return snapshotQuotes(symbols);
  },

  async getBars() {
    return [];
  },

  async getStockAnalysis(ticker: string) {
    const normalized = normalizeTicker(ticker);
    if (!TICKER_BY_SYMBOL[normalized]) return null;
    if (!getPseCompanyByTicker(normalized)) return null;

    const quotes = snapshotQuotes([normalized]);
    const quote = quotes.get(tickerToSymbol(normalized));
    return buildMarketAnalysis(normalized, quote, []);
  },

  async getStockHistory(ticker: string, range: BarRange) {
    void range;
    const analysis = await this.getStockAnalysis(ticker);
    return analysis?.chartData ?? null;
  },

  async getMarketOverview() {
    const quotes = snapshotQuotes();
    const asOf = getQuotesSnapshotAsOf();
    const pseiQuote = quotes.get("PSEI");

    if (quotes.size === 0) {
      return {
        overview: applyMarketSession(marketOverview),
        featured: featuredStocks,
        pseiChart: pseiData,
        recent: recentAnalysis,
      };
    }

    const pseiChart = pseiQuote
      ? mergePseiQuoteIntoChartPoints(pseiData, pseiQuote)
      : pseiData;

    return {
      overview: overviewFromQuotes(quotes),
      featured: buildFeaturedFromQuotes(quotes),
      pseiChart,
      recent: buildRecentFromQuotes(quotes),
      quotesAsOf: asOf ? formatAsOf(asOf) : null,
      stale: asOf ? isQuoteStale(asOf) : false,
    };
  },

  async getForecastsData() {
    const snapRows = getAllForecastsFromSnapshot();
    if (snapRows.length === 0) {
      return {
        forecasts: allForecasts,
        modelPerformance,
        summary: forecastSummary,
      };
    }

    const quotes = snapshotQuotes();
    const forecasts = snapRows
      .filter((r) => r.horizonDays === 7 && r.model === "linear")
      .map((row) => {
        const ticker = symbolToTicker(row.symbol);
        const company = getPseCompanyByTicker(ticker);
        const quote = quotes.get(row.symbol);
        const lastForecast = [...row.points].reverse().find((p) => p.forecast != null);
        return {
          ticker,
          company: company?.companyName ?? row.symbol,
          sector: company?.sector ?? "Equity",
          currentPrice: quote ? String(quote.lastClose) : "—",
          forecast7d: lastForecast?.forecast != null ? String(lastForecast.forecast) : "—",
          trend: "Mixed Signal" as const,
          accuracy: "—",
          date: row.generatedAt.slice(0, 10),
        };
      });

    return {
      forecasts,
      modelPerformance,
      summary: {
        ...forecastSummary,
        totalToday: forecasts.length,
      },
    };
  },
};
