import rawSnapshot from "../../../data/market-quotes-snapshot.json";
import type { MarketQuote } from "@/lib/market/types";

type SnapshotRow = {
  symbol: string;
  lastClose: number;
  changePct: number;
  changeAbs?: number | null;
  volume?: number | null;
  asOf: string;
  source: string;
};

type QuotesSnapshotFile = {
  asOf: string;
  source: string;
  quotes: SnapshotRow[];
};

let cached: Map<string, MarketQuote> | null | undefined;

function parseSnapshot(): Map<string, MarketQuote> | null {
  if (cached !== undefined) return cached;

  try {
    const data = rawSnapshot as QuotesSnapshotFile;
    if (!Array.isArray(data.quotes) || data.quotes.length === 0) {
      cached = null;
      return null;
    }
    const map = new Map<string, MarketQuote>();
    for (const row of data.quotes) {
      map.set(row.symbol.toUpperCase(), {
        symbol: row.symbol.toUpperCase(),
        lastClose: row.lastClose,
        changePct: row.changePct,
        changeAbs: row.changeAbs ?? null,
        volume: row.volume ?? null,
        asOf: new Date(row.asOf),
        source: row.source,
      });
    }
    cached = map;
    return map;
  } catch {
    cached = null;
    return null;
  }
}

export function getQuotesSnapshot(): Map<string, MarketQuote> | null {
  return parseSnapshot();
}

export function getQuotesSnapshotAsOf(): Date | null {
  const map = getQuotesSnapshot();
  if (!map || map.size === 0) return null;

  let max = new Date(0);
  for (const quote of map.values()) {
    if (quote.asOf > max) max = quote.asOf;
  }
  return max.getTime() > 0 ? max : null;
}
