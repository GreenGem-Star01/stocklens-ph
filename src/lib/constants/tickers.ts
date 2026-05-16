import {
  ALL_STOCK_SEEDS,
  BLUE_CHIP_SEEDS,
} from "@/lib/data/stock-seeds";

export type TickerEntry = {
  ticker: string;
  path: string;
  name: string;
  sector: string;
};

export const SUPPORTED_TICKERS: TickerEntry[] = ALL_STOCK_SEEDS.map(
  (seed) => ({
    ticker: seed.ticker,
    path: seed.path,
    name: seed.shortName,
    sector: seed.sector,
  }),
);

/** Equity blue chips only (excludes PSEI index). */
export const BLUE_CHIP_TICKERS: TickerEntry[] = BLUE_CHIP_SEEDS.map(
  (seed) => ({
    ticker: seed.ticker,
    path: seed.path,
    name: seed.shortName,
    sector: seed.sector,
  }),
);

export const TICKER_PATHS = new Set(SUPPORTED_TICKERS.map((t) => t.path));

export const TICKER_BY_PATH = Object.fromEntries(
  SUPPORTED_TICKERS.map((t) => [t.path, t.ticker]),
) as Record<string, string>;

export const TICKER_BY_SYMBOL = Object.fromEntries(
  SUPPORTED_TICKERS.map((t) => [t.ticker, t]),
) as Record<string, TickerEntry>;

export function normalizeTickerInput(input: string): string {
  return input.trim().toUpperCase().replace(/\.PS$/i, "");
}

export function resolveTickerFromInput(input: string): TickerEntry | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper.includes(".PS") && TICKER_BY_SYMBOL[upper]) {
    return TICKER_BY_SYMBOL[upper];
  }

  const path = trimmed.toLowerCase().replace(/\.ps$/i, "");
  const ticker = TICKER_BY_PATH[path];
  if (ticker) return TICKER_BY_SYMBOL[ticker];

  const withPs = `${normalizeTickerInput(trimmed)}.PS`;
  return TICKER_BY_SYMBOL[withPs] ?? null;
}
