import type { MarketQuote } from "@/lib/market/types";

/** JSON-safe shape stored in Next.js unstable_cache. */
export type CachedQuoteEntry = {
  symbol: string;
  lastClose: number;
  changePct: number;
  changeAbs: number | null;
  volume: number | null;
  asOf: string;
  source: string;
};

export function quotesMapToEntries(
  map: Map<string, MarketQuote>,
): CachedQuoteEntry[] {
  return Array.from(map.entries()).map(([, q]) => ({
    symbol: q.symbol,
    lastClose: q.lastClose,
    changePct: q.changePct,
    changeAbs: q.changeAbs,
    volume: q.volume,
    asOf: q.asOf.toISOString(),
    source: q.source,
  }));
}

export function entriesToQuotesMap(
  entries: CachedQuoteEntry[],
): Map<string, MarketQuote> {
  const map = new Map<string, MarketQuote>();
  for (const row of entries) {
    map.set(row.symbol, {
      symbol: row.symbol,
      lastClose: row.lastClose,
      changePct: row.changePct,
      changeAbs: row.changeAbs,
      volume: row.volume,
      asOf: new Date(row.asOf),
      source: row.source,
    });
  }
  return map;
}

/** unstable_cache deserializes Map → plain object; normalize for .get(). */
export function toQuotesMap(
  quotes?: Map<string, MarketQuote> | Record<string, MarketQuote> | null,
): Map<string, MarketQuote> {
  if (!quotes) return new Map();
  if (quotes instanceof Map) return quotes;
  return new Map(Object.entries(quotes));
}
