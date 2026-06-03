import { unstable_cache } from "next/cache";

import { query } from "@/lib/db/client";
import { isDbMarketEnabled } from "@/lib/db/config";
import type { MarketQuote } from "@/lib/market/types";
import {
  entriesToQuotesMap,
  quotesMapToEntries,
  type CachedQuoteEntry,
} from "@/lib/market/quotes-map";
import { tickerToSymbol } from "@/lib/market/symbol";

type QuoteRow = {
  symbol: string;
  last_close: string;
  change_pct: string;
  change_abs: string | null;
  volume: string | null;
  as_of: Date;
  source: string;
};

function rowToQuote(row: QuoteRow): MarketQuote {
  return {
    symbol: row.symbol,
    lastClose: Number(row.last_close),
    changePct: Number(row.change_pct),
    changeAbs: row.change_abs != null ? Number(row.change_abs) : null,
    volume: row.volume != null ? Number(row.volume) : null,
    asOf: new Date(row.as_of),
    source: row.source,
  };
}

export async function fetchLatestQuotes(
  symbols?: string[],
): Promise<Map<string, MarketQuote>> {
  if (!isDbMarketEnabled()) {
    return new Map();
  }

  const normalized =
    symbols?.map((s) => tickerToSymbol(s)).filter(Boolean) ?? [];

  const rows =
    normalized.length > 0
      ? await query<QuoteRow>(
          `SELECT symbol, last_close, change_pct, change_abs, volume, as_of, source
           FROM market_quotes_latest
           WHERE symbol = ANY($1::text[])`,
          [normalized],
        )
      : await query<QuoteRow>(
          `SELECT symbol, last_close, change_pct, change_abs, volume, as_of, source
           FROM market_quotes_latest`,
        );

  const map = new Map<string, MarketQuote>();
  for (const row of rows) {
    map.set(row.symbol, rowToQuote(row));
  }
  return map;
}

export async function getLatestQuotes(
  symbols?: string[],
): Promise<Map<string, MarketQuote>> {
  if (!isDbMarketEnabled()) {
    return new Map();
  }

  const cacheKey = symbols?.map(tickerToSymbol).sort().join(",") ?? "all";
  const entries = await unstable_cache(
    async (): Promise<CachedQuoteEntry[]> => {
      const map = await fetchLatestQuotes(symbols);
      return quotesMapToEntries(map);
    },
    ["market-quotes", cacheKey],
    { revalidate: 60, tags: ["market-quotes"] },
  )();
  return entriesToQuotesMap(entries);
}

export async function getQuotesAsOf(): Promise<Date | null> {
  if (!isDbMarketEnabled()) return null;
  const rows = await query<{ as_of: Date }>(
    `SELECT MAX(as_of) AS as_of FROM market_quotes_latest`,
  );
  const asOf = rows[0]?.as_of;
  return asOf ? new Date(asOf) : null;
}
