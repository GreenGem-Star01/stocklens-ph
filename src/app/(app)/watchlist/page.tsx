import { ForecastDisclaimer } from "@/components/dashboard/forecast-disclaimer";
import { WatchlistCards } from "@/components/watchlist/watchlist-cards";
import { WatchlistHeader } from "@/components/watchlist/watchlist-header";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";

export default function WatchlistPage() {
  return (
    <div className="container mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <WatchlistHeader />
      <WatchlistCards />
      <WatchlistTable />
      <ForecastDisclaimer />
    </div>
  );
}
