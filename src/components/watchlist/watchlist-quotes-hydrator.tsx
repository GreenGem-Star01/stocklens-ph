"use client";

import { useEffect } from "react";

import { useWatchlistStore } from "@/lib/stores/watchlist-store";

export function WatchlistQuotesHydrator() {
  const stocks = useWatchlistStore((s) => s.stocks);
  const refreshPrices = useWatchlistStore((s) => s.refreshPrices);

  useEffect(() => {
    if (stocks.length === 0) return;
    void refreshPrices();
  }, [stocks.length, refreshPrices]);

  return null;
}
