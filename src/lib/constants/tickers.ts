import {
  getAllCatalogEntries,
  getListedEquities,
  getListedEquityCount,
  getPseCompanyByPath,
  getPseCompanyByTicker,
  getPseIndices,
} from "@/lib/pse/universe";

export type TickerEntry = {
  ticker: string;
  path: string;
  name: string;
  sector: string;
  subsector: string;
};

function toTickerEntry(
  company: ReturnType<typeof getListedEquities>[number],
): TickerEntry {
  return {
    ticker: company.ticker,
    path: company.path,
    name: company.companyName,
    sector: company.sector,
    subsector: company.subsector,
  };
}

export const SUPPORTED_TICKERS: TickerEntry[] = getAllCatalogEntries().map(
  toTickerEntry,
);

export const LISTED_EQUITY_TICKERS: TickerEntry[] =
  getListedEquities().map(toTickerEntry);

export const TICKER_PATHS = new Set(SUPPORTED_TICKERS.map((t) => t.path));

export const TICKER_BY_PATH = Object.fromEntries(
  SUPPORTED_TICKERS.map((t) => [t.path, t.ticker]),
) as Record<string, string>;

export const TICKER_BY_SYMBOL = Object.fromEntries(
  SUPPORTED_TICKERS.map((t) => [t.ticker, t]),
) as Record<string, TickerEntry>;

export { getListedEquityCount };

export function normalizeTickerInput(input: string): string {
  return input.trim().toUpperCase().replace(/\.PS$/i, "");
}

export function resolveTickerFromInput(input: string): TickerEntry | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper.includes(".PS")) {
    const entry = TICKER_BY_SYMBOL[upper];
    return entry ?? null;
  }

  const path = trimmed.toLowerCase().replace(/\.ps$/i, "");
  const ticker = TICKER_BY_PATH[path];
  if (ticker) return TICKER_BY_SYMBOL[ticker];

  const company = getPseCompanyByPath(path);
  if (company) return toTickerEntry(company);

  const withPs = `${normalizeTickerInput(trimmed)}.PS`;
  return TICKER_BY_SYMBOL[withPs] ?? null;
}

export function resolveTickerEntry(tickerOrPath: string): TickerEntry | null {
  return (
    resolveTickerFromInput(tickerOrPath) ??
    (getPseCompanyByTicker(tickerOrPath)
      ? toTickerEntry(getPseCompanyByTicker(tickerOrPath)!)
      : null)
  );
}
