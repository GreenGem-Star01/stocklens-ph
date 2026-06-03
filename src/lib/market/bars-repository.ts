import { unstable_cache } from "next/cache";

import { query } from "@/lib/db/client";
import { isDbMarketEnabled } from "@/lib/db/config";
import { tickerToSymbol } from "@/lib/market/symbol";
import type { BarRange, MarketBar } from "@/lib/market/types";
import { BAR_RANGE_DAYS } from "@/lib/market/types";

type BarRow = {
  symbol: string;
  trade_date: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string | null;
};

function rowToBar(row: BarRow): MarketBar {
  const date =
    row.trade_date instanceof Date
      ? row.trade_date.toISOString().slice(0, 10)
      : String(row.trade_date).slice(0, 10);
  return {
    symbol: row.symbol,
    tradeDate: date,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: row.volume != null ? Number(row.volume) : null,
  };
}

export async function fetchDailyBars(
  ticker: string,
  range: BarRange,
): Promise<MarketBar[]> {
  if (!isDbMarketEnabled()) return [];

  const symbol = tickerToSymbol(ticker);
  const days = BAR_RANGE_DAYS[range];

  const rows = await query<BarRow>(
    `SELECT symbol, trade_date, open, high, low, close, volume
     FROM market_bars_daily
     WHERE symbol = $1
       AND trade_date >= CURRENT_DATE - $2::int
     ORDER BY trade_date ASC`,
    [symbol, days],
  );

  return rows.map(rowToBar);
}

export async function getDailyBars(
  ticker: string,
  range: BarRange,
): Promise<MarketBar[]> {
  if (!isDbMarketEnabled()) return [];

  const symbol = tickerToSymbol(ticker);
  return unstable_cache(
    () => fetchDailyBars(ticker, range),
    ["market-bars", symbol, range],
    { revalidate: 300, tags: [`market-bars:${symbol}`] },
  )();
}

export function weekRangeFromBars(bars: MarketBar[]): {
  low: number;
  high: number;
} | null {
  if (bars.length === 0) return null;
  const recent = bars.slice(-5);
  const lows = recent.map((b) => b.low);
  const highs = recent.map((b) => b.high);
  return { low: Math.min(...lows), high: Math.max(...highs) };
}
