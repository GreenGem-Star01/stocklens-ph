import { WatchlistContent } from "@/components/watchlist/watchlist-content";
import { WatchlistHeader } from "@/components/watchlist/watchlist-header";
import { APP_PAGE_CLASS } from "@/lib/layout";

export default function WatchlistPage() {
  return (
    <div className={APP_PAGE_CLASS}>
      <WatchlistHeader />
      <WatchlistContent />
    </div>
  );
}
