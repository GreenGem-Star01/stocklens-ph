/**
 * Yahoo Finance chart API (unofficial). For batch EOD ingest only — not used at request time.
 */

export type EodQuote = {
  symbol: string;
  lastClose: number;
  changePct: number;
  changeAbs: number;
  volume: number | null;
  asOf: Date;
};

export type DailyBar = {
  symbol: string;
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

export type YahooFetchDiagnostic = {
  symbol: string;
  yahooSymbol: string;
  host: string;
  status: number | null;
  error?: string;
  barCount: number;
  attempts: number;
};

const USER_AGENT =
  "StockLensPH-ingest/1.0 (educational; batch EOD)";

const YAHOO_QUERY_HOSTS = [
  "query1.finance.yahoo.com",
  "query2.finance.yahoo.com",
] as const;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        regularMarketVolume?: number;
        regularMarketTime?: number;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string; code?: string };
  };
};

export function yahooRangeParam(rangeDays: number): string {
  if (rangeDays <= 90) return "3mo";
  if (rangeDays <= 365) return "1y";
  return "max";
}

export function parseDailyBarsFromChart(
  body: YahooChartResponse,
  yahooSymbol: string,
  rangeDays: number,
): DailyBar[] {
  const chartError = body.chart?.error?.description;
  if (chartError) {
    throw new Error(chartError);
  }

  const result = body.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0];
  if (!q || timestamps.length === 0) return [];

  const bare = yahooSymbol.replace(/\.PS$/i, "").toUpperCase();
  const bars: DailyBar[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const close = q.close?.[i];
    if (close == null || Number.isNaN(close)) continue;
    const open = q.open?.[i] ?? close;
    const high = q.high?.[i] ?? close;
    const low = q.low?.[i] ?? close;
    const vol = q.volume?.[i];
    const tradeDate = new Date(timestamps[i]! * 1000)
      .toISOString()
      .slice(0, 10);
    bars.push({
      symbol: bare,
      tradeDate,
      open,
      high,
      low,
      close,
      volume: vol != null ? Math.round(vol) : null,
    });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return bars.filter((b) => b.tradeDate >= cutoffIso);
}

async function fetchChartJson(
  host: string,
  yahooSymbol: string,
  range: string,
): Promise<{ status: number; body: YahooChartResponse | null }> {
  const url = `https://${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=${range}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    return { status: res.status, body: null };
  }

  const body = (await res.json()) as YahooChartResponse;
  return { status: res.status, body };
}

export async function fetchYahooDailyBars(
  symbol: string,
  rangeDays: number,
  delayMs = 120,
  options?: {
    verbose?: boolean;
    maxAttempts?: number;
  },
): Promise<DailyBar[]> {
  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.PS`;
  const range = yahooRangeParam(rangeDays);
  const maxAttempts = options?.maxAttempts ?? 3;
  let lastDiagnostic: YahooFetchDiagnostic = {
    symbol,
    yahooSymbol,
    host: YAHOO_QUERY_HOSTS[0],
    status: null,
    barCount: 0,
    attempts: 0,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const host of YAHOO_QUERY_HOSTS) {
      lastDiagnostic = {
        ...lastDiagnostic,
        host,
        attempts: attempt,
      };

      try {
        const { status, body } = await fetchChartJson(host, yahooSymbol, range);
        lastDiagnostic.status = status;

        if (!body) {
          if (RETRYABLE_STATUS.has(status)) {
            if (options?.verbose) {
              console.warn(
                `  [yahoo] ${symbol}: HTTP ${status} from ${host} (attempt ${attempt}/${maxAttempts})`,
              );
            }
            await sleep(400 * attempt);
            continue;
          }
          if (options?.verbose) {
            console.warn(
              `  [yahoo] ${symbol}: HTTP ${status} from ${host} (non-retryable)`,
            );
          }
          continue;
        }

        const bars = parseDailyBarsFromChart(body, yahooSymbol, rangeDays);
        lastDiagnostic.barCount = bars.length;

        if (bars.length > 0) {
          if (delayMs > 0) await sleep(delayMs);
          return bars;
        }

        const chartErr = body.chart?.error?.description;
        if (options?.verbose) {
          console.warn(
            `  [yahoo] ${symbol}: 0 bars from ${host}${chartErr ? ` — ${chartErr}` : " (empty chart)"}`,
          );
        }
      } catch (err) {
        lastDiagnostic.error =
          err instanceof Error ? err.message : String(err);
        if (options?.verbose) {
          console.warn(
            `  [yahoo] ${symbol}: ${lastDiagnostic.error} (${host}, attempt ${attempt})`,
          );
        }
        await sleep(400 * attempt);
      }
    }

    await sleep(600 * attempt);
  }

  if (options?.verbose && lastDiagnostic.barCount === 0) {
    console.warn(
      `  [yahoo] ${symbol}: failed after ${maxAttempts} attempts (last status ${lastDiagnostic.status ?? "n/a"})`,
    );
  }

  if (delayMs > 0) await sleep(delayMs);
  return [];
}

export async function fetchYahooEodQuote(
  symbol: string,
  delayMs = 120,
): Promise<EodQuote | null> {
  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.PS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (delayMs > 0) await sleep(delayMs);

  if (!res.ok) return null;

  const body = (await res.json()) as YahooChartResponse;
  const result = body.chart?.result?.[0];
  if (!result?.meta) return null;

  const closes =
    result.indicators?.quote?.[0]?.close?.filter(
      (c): c is number => c != null && !Number.isNaN(c),
    ) ?? [];

  const lastClose =
    result.meta.regularMarketPrice ??
    closes.at(-1) ??
    null;
  if (lastClose == null) return null;

  const prev =
    result.meta.chartPreviousClose ??
    closes.at(-2) ??
    lastClose;
  const changeAbs = lastClose - prev;
  const changePct = prev !== 0 ? (changeAbs / prev) * 100 : 0;

  const volumes = result.indicators?.quote?.[0]?.volume ?? [];
  const volume =
    result.meta.regularMarketVolume ??
    volumes.filter((v): v is number => v != null).at(-1) ??
    null;

  const asOfSec = result.meta.regularMarketTime;
  const asOf = asOfSec
    ? new Date(asOfSec * 1000)
    : new Date();

  const bare = yahooSymbol.replace(/\.PS$/i, "").toUpperCase();

  return {
    symbol: bare,
    lastClose,
    changePct,
    changeAbs,
    volume: volume != null ? Math.round(volume) : null,
    asOf,
  };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i]!, i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function fetchYahooEodQuotes(
  symbols: string[],
  options?: {
    delayMs?: number;
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<EodQuote[]> {
  const delayMs = options?.delayMs ?? 80;
  const concurrency = options?.concurrency ?? 8;
  let completed = 0;

  const results = await mapPool(symbols, concurrency, async (symbol) => {
    const quote = await fetchYahooEodQuote(symbol, delayMs);
    completed++;
    options?.onProgress?.(completed, symbols.length);
    return quote;
  });

  return results.filter((q): q is EodQuote => q != null);
}
