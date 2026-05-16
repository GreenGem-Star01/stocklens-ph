"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { WATCHLIST_MAX_STOCKS } from "@/lib/constants/watchlist";
import { watchlistStocks as seedWatchlist } from "@/lib/data/watchlist";
import type { WatchlistStock } from "@/lib/data/watchlist";
import { TICKER_BY_SYMBOL } from "@/lib/constants/tickers";
import { getStockAnalysisStatic } from "@/lib/data/stocks";

export type AddStockResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "invalid" | "limit" };

type WatchlistState = {
  stocks: WatchlistStock[];
  addStock: (ticker: string) => AddStockResult;
  removeStock: (ticker: string) => void;
  hasStock: (ticker: string) => boolean;
  isAtLimit: () => boolean;
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
          return { ok: false, reason: "duplicate" };
        }
        if (get().stocks.length >= WATCHLIST_MAX_STOCKS) {
          return { ok: false, reason: "limit" };
        }
        const entry = toWatchlistEntry(normalized);
        if (!entry) return { ok: false, reason: "invalid" };
        set((state) => ({ stocks: [...state.stocks, entry] }));
        return { ok: true };
      },
      removeStock: (ticker) => {
        const normalized = ticker.toUpperCase();
        set((state) => ({
          stocks: state.stocks.filter((s) => s.ticker !== normalized),
        }));
      },
      hasStock: (ticker) =>
        get().stocks.some((s) => s.ticker === ticker.toUpperCase()),
      isAtLimit: () => get().stocks.length >= WATCHLIST_MAX_STOCKS,
    }),
    {
      name: "stocklens-watchlist",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { stocks?: WatchlistStock[] };
        if (version < 2 && Array.isArray(state.stocks)) {
          return {
            stocks: state.stocks.slice(0, WATCHLIST_MAX_STOCKS),
          };
        }
        return persisted as WatchlistState;
      },
    },
  ),
);
