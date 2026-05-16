"use client";

import { ForecastDisclaimer } from "@/components/dashboard/forecast-disclaimer";
import { WatchlistCards } from "@/components/watchlist/watchlist-cards";
import { WatchlistEmpty } from "@/components/watchlist/watchlist-empty";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

export function WatchlistContent() {
  const stocks = useWatchlistStore((s) => s.stocks);

  if (stocks.length === 0) {
    return <WatchlistEmpty />;
  }

  return (
    <>
      <WatchlistCards />
      <WatchlistTable />
      <ForecastDisclaimer />
    </>
  );
}
