import { getQuotesForSymbols } from "@/lib/api/market-provider";
import { toQuotesMap } from "@/lib/market/quotes-map";
import { isDbMarketEnabled } from "@/lib/db/config";
import { formatAsOf, isQuoteStale } from "@/lib/market/format-quote";
import { getQuotesAsOf } from "@/lib/market/quotes-repository";

export async function getStocksMarketPriceNote(): Promise<string | null> {
  if (isDbMarketEnabled()) {
    const asOf = await getQuotesAsOf();
    if (!asOf) return null;
    const stale = isQuoteStale(asOf);
    return `Market prices as of ${formatAsOf(asOf)}${stale ? " (may be stale)" : ""}.`;
  }

  const quoteMap = toQuotesMap(await getQuotesForSymbols());
  if (quoteMap.size === 0) return null;
  const first = quoteMap.values().next().value;
  if (!first) return null;
  const stale = isQuoteStale(first.asOf);
  return `Market prices from snapshot as of ${formatAsOf(first.asOf)}${stale ? " (may be stale)" : ""}.`;
}
