/**
 * PSE EDGE mobile API — batch EOD ingest only (official PSE-operated).
 */
import type { EodQuote } from "./yahoo-eod";

const EDGE_STOCK_DATA_URL =
  "https://edge.pse.com.ph/mobile/com.pse.ctrl.companyinformation.krx?method=stockdataList";

const USER_AGENT =
  "StockLensPH-ingest/1.0 (educational; PSE EDGE EOD)";

export type EdgeQuoteInput = {
  symbol: string;
  companyId: string;
};

type EdgeStockRow = {
  SYMBOL?: string;
  LAST_TRADED_PRICE?: number;
  PREVIOUS_CLOSE?: number;
  PERCENT_CHANGE?: number;
  CHANGE_POINT?: number;
  VOLUME?: number;
  TRADINGTIME?: number;
  SECURITY_STATUS?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

function rowToQuote(row: EdgeStockRow, symbol: string): EodQuote | null {
  const last =
    row.LAST_TRADED_PRICE ??
    row.PREVIOUS_CLOSE ??
    null;
  if (last == null || Number.isNaN(last)) return null;

  const prev = row.PREVIOUS_CLOSE ?? last;
  let changePct = row.PERCENT_CHANGE ?? 0;
  if (
    (changePct === 0 || Number.isNaN(changePct)) &&
    row.CHANGE_POINT != null &&
    prev !== 0
  ) {
    changePct = (row.CHANGE_POINT / prev) * 100;
  }

  const changeAbs =
    row.CHANGE_POINT ??
    (prev !== 0 ? last - prev : 0);

  const asOf = row.TRADINGTIME
    ? new Date(row.TRADINGTIME)
    : new Date();

  return {
    symbol: symbol.toUpperCase(),
    lastClose: last,
    changePct,
    changeAbs,
    volume:
      row.VOLUME != null && !Number.isNaN(row.VOLUME)
        ? Math.round(row.VOLUME)
        : null,
    asOf,
  };
}

export async function fetchPseEdgeQuote(
  companyId: string,
  symbol: string,
  delayMs = 50,
): Promise<EodQuote | null> {
  const body = new URLSearchParams({
    company_id: companyId,
    isApp: "N",
  });

  const res = await fetch(EDGE_STOCK_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: body.toString(),
  });

  if (delayMs > 0) await sleep(delayMs);

  if (!res.ok) return null;

  const json = (await res.json()) as { list?: EdgeStockRow[] };
  const row = json.list?.[0];
  if (!row) return null;

  return rowToQuote(row, row.SYMBOL ?? symbol);
}

export async function fetchPseEdgeQuotes(
  inputs: EdgeQuoteInput[],
  options?: {
    delayMs?: number;
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<EodQuote[]> {
  const delayMs = options?.delayMs ?? 50;
  const concurrency = options?.concurrency ?? 10;
  let completed = 0;

  const results = await mapPool(inputs, concurrency, async (input) => {
    const quote = await fetchPseEdgeQuote(
      input.companyId,
      input.symbol,
      delayMs,
    );
    completed++;
    options?.onProgress?.(completed, inputs.length);
    return quote;
  });

  return results.filter((q): q is EodQuote => q != null);
}
