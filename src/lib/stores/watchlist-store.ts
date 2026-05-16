"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { watchlistStocks as seedWatchlist } from "@/lib/data/watchlist";
import type { WatchlistStock } from "@/lib/data/watchlist";
import { TICKER_BY_SYMBOL } from "@/lib/constants/tickers";
import { getStockAnalysisStatic } from "@/lib/data/stocks";

type WatchlistState = {
  stocks: WatchlistStock[];
  addStock: (ticker: string) => boolean;
  removeStock: (ticker: string) => void;
  hasStock: (ticker: string) => boolean;
};

function toWatchlistEntry(ticker: string): WatchlistStock | null {
  const entry = TICKER_BY_SYMBOL[ticker.toUpperCase()];
  if (!entry) return null;

  const analysis = getStockAnalysisStatic(entry.ticker);
  if (!analysis) return null;

  return {
    ticker: entry.ticker,
    name: entry.name,
    price: analysis.metrics.lastClose,
    change: analysis.metrics.dailyChange,
    positive: analysis.metrics.dailyChangePositive,
    sector: entry.sector,
    trend: analysis.trend,
    addedDate: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      stocks: seedWatchlist,
      addStock: (ticker) => {
        const normalized = ticker.toUpperCase();
        if (get().stocks.some((s) => s.ticker === normalized)) {
          return false;
        }
        const entry = toWatchlistEntry(normalized);
        if (!entry) return false;
        set((state) => ({ stocks: [...state.stocks, entry] }));
        return true;
      },
      removeStock: (ticker) => {
        const normalized = ticker.toUpperCase();
        set((state) => ({
          stocks: state.stocks.filter((s) => s.ticker !== normalized),
        }));
      },
      hasStock: (ticker) =>
        get().stocks.some((s) => s.ticker === ticker.toUpperCase()),
    }),
    {
      name: "stocklens-watchlist",
      version: 1,
    },
  ),
);
