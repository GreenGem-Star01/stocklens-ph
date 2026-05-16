import { WATCHLIST_MAX_STOCKS } from "@/lib/constants/watchlist";
import type { AddStockResult } from "@/lib/stores/watchlist-store";

export function formatWatchlistCount(count: number): string {
  return `${count} of ${WATCHLIST_MAX_STOCKS} stocks`;
}

export function watchlistAddToast(
  result: AddStockResult,
): "success" | "error" | "message" | null {
  if (result.ok) return "success";
  switch (result.reason) {
    case "duplicate":
      return "message";
    case "limit":
      return "error";
    case "invalid":
      return "error";
    default:
      return null;
  }
}

export function watchlistAddDescription(
  result: AddStockResult,
  ticker: string,
): string {
  if (result.ok) return `${ticker} added to watchlist.`;
  switch (result.reason) {
    case "duplicate":
      return `${ticker} is already on your watchlist.`;
    case "limit":
      return `Watchlist is full (${WATCHLIST_MAX_STOCKS} stocks max). Remove one to add another.`;
    case "invalid":
      return `${ticker} is not supported.`;
    default:
      return "Could not add to watchlist.";
  }
}
