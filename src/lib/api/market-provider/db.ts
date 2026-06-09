import {
  featuredStocks as staticFeatured,
  marketOverview as staticOverview,
  pseiData,
  recentAnalysis as staticRecent,
} from "@/lib/data/dashboard";
import { buildMarketAnalysis } from "@/lib/data/build-market-analysis";
import { TICKER_BY_SYMBOL } from "@/lib/constants/tickers";
import type { MarketProvider } from "@/lib/api/market-provider/types";
import { getDailyBars } from "@/lib/market/bars-repository";
import { buildPseiChartFromMarket, mergePseiQuoteIntoChartPoints } from "@/lib/market/psei-chart";
import {
  formatAsOf,
  formatChangePct,
  formatPriceAmount,
  isQuoteStale,
  quoteToDisplay,
} from "@/lib/market/format-quote";
import { applyMarketSession } from "@/lib/market/pse-session";
import { getLatestQuotes, getQuotesAsOf } from "@/lib/market/quotes-repository";
import { fetchAllForecastSymbols, fetchModelMetrics } from "@/lib/market/forecasts-repository";
import { symbolToTicker, tickerToSymbol } from "@/lib/market/symbol";
import type { BarRange, MarketBar } from "@/lib/market/types";
import type { FeaturedStock, RecentAnalysisRow } from "@/lib/types/stock";
import { getPseCompanyByTicker } from "@/lib/pse/universe";

function normalizeTicker(ticker: string): string {
  return ticker.toUpperCase().includes(".PS")
    ? ticker.toUpperCase()
    : `${ticker.toUpperCase()}.PS`;
}

function formatBarDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function barsToChartPoints(bars: MarketBar[]) {
  return bars.map((bar) => ({
    date: formatBarDate(bar.tradeDate),
    price: Number(bar.close),
    forecast: null,
  }));
}

function buildFeaturedFromQuotes(
  quotes: Map<string, import("@/lib/market/types").MarketQuote>,
): FeaturedStock[] {
  return staticFeatured.map((seed) => {
    const symbol = tickerToSymbol(seed.ticker);
    const quote = quotes.get(symbol);
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
  quotes: Map<string, import("@/lib/market/types").MarketQuote>,
): RecentAnalysisRow[] {
  return staticRecent.map((row) => {
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

function overviewFromQuotes(
  quotes: Map<string, import("@/lib/market/types").MarketQuote>,
) {
  let topGainer = staticOverview.topGainer;
  let topLoser = staticOverview.topLoser;
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
    ...staticOverview,
    pseiValue: psei
      ? quoteToDisplay(psei, true).lastClose
      : staticOverview.pseiValue,
    pseiChange: psei
      ? quoteToDisplay(psei, true).dailyChange
      : staticOverview.pseiChange,
    topGainer,
    topLoser,
  });
}

export const dbMarketProvider: MarketProvider = {
  async getLatestQuotes(symbols) {
    return getLatestQuotes(symbols);
  },

  async getBars(ticker, range) {
    return getDailyBars(ticker, range);
  },

  async getStockAnalysis(ticker) {
    const normalized = normalizeTicker(ticker);
    if (!TICKER_BY_SYMBOL[normalized]) return null;
    if (!getPseCompanyByTicker(normalized)) return null;

    const symbol = tickerToSymbol(normalized);
    const quotes = await getLatestQuotes([normalized]);
    const quote = quotes.get(symbol);
    const bars = await getDailyBars(normalized, "1y");

    return buildMarketAnalysis(normalized, quote, bars);
  },

  async getStockHistory(ticker, range) {
    const normalized = normalizeTicker(ticker);
    if (!getPseCompanyByTicker(normalized)) return null;

    const bars = await getDailyBars(normalized, range);
    if (bars.length > 0) {
      return barsToChartPoints(bars);
    }
    return [];
  },

  async getMarketOverview() {
    const quotes = await getLatestQuotes();
    const asOf = await getQuotesAsOf();
    const stale = asOf ? isQuoteStale(asOf) : false;

    const pseiQuote = quotes.get("PSEI");
    const pseiBars = await getDailyBars("PSEI.PS", "30d");
    const fromBars = buildPseiChartFromMarket(pseiBars, pseiQuote);
    const pseiChart =
      fromBars.length > 0
        ? fromBars
        : pseiQuote
          ? mergePseiQuoteIntoChartPoints(pseiData, pseiQuote)
          : pseiData;

    return {
      overview: overviewFromQuotes(quotes),
      featured: buildFeaturedFromQuotes(quotes),
      pseiChart,
      recent: buildRecentFromQuotes(quotes),
      quotesAsOf: asOf ? formatAsOf(asOf) : null,
      stale,
    };
  },

  async getForecastsData() {
    const symbols = await fetchAllForecastSymbols();
    const quotes = await getLatestQuotes();

    const forecasts = await Promise.all(
      symbols.slice(0, 100).map(async (symbol) => {
        const ticker = symbolToTicker(symbol);
        const company = getPseCompanyByTicker(ticker);
        const quote = quotes.get(symbol);
        const metrics = await fetchModelMetrics(ticker, 7);
        const best = metrics[0];
        const price = quote
          ? formatPriceAmount(quote.lastClose)
          : "—";

        return {
          ticker,
          company: company?.companyName ?? symbol,
          sector: company?.sector ?? "Equity",
          currentPrice: price,
          forecast7d: "—",
          trend: "Mixed Signal" as const,
          accuracy: best?.dirAccuracy != null ? `${best.dirAccuracy.toFixed(1)}%` : "—",
          date: new Date().toISOString().slice(0, 10),
          expectedChange: quote ? formatChangePct(quote.changePct) : "—",
        };
      }),
    );

    return {
      forecasts,
      modelPerformance: [],
      summary: {
        totalToday: forecasts.length,
        lastUpdated: new Date().toISOString().slice(0, 10),
        averageAccuracy: "—",
        upwardCount: 0,
        upwardPercent: "0%",
      },
    };
  },
};
