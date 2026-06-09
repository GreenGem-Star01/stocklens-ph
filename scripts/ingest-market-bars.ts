/**
 * Daily OHLCV ingest for all listed tickers → market_bars_daily
 * Run: npm run ingest:bars
 * Flags: --verbose, --probe=BDO, --concurrency=3
 */
import "dotenv/config";
import { closeIngestPool, getIngestPool } from "./lib/db-ingest";
import { assertValidDatabaseUrl, loadMarketEnv } from "./lib/load-market-env";
import {
  loadCompanyIdBySymbol,
  loadIngestSymbols,
} from "./lib/universe-symbols";
import {
  fetchPseEdgeHistoricalBars,
  fetchPseEdgeSecurityId,
} from "./market/pse-edge-bars";
import { fetchYahooDailyBars } from "./market/yahoo-eod";

const RANGE_DAYS = 400;
const DELAY_MS = 700;
const MIN_EQUITY_SYMBOLS_WARN = 250;

function parseProbeSymbol(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--probe="));
  if (!arg) return null;
  return arg.split("=")[1]?.trim().toUpperCase() ?? null;
}

function parseConcurrency(): number {
  const arg = process.argv.find((a) => a.startsWith("--concurrency="));
  const n = arg ? Number(arg.split("=")[1]) : 1;
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 5) : 1;
}

async function upsertBars(
  bars: Awaited<ReturnType<typeof fetchYahooDailyBars>>,
): Promise<number> {
  const pool = getIngestPool();
  let written = 0;

  for (const bar of bars) {
    await pool.query(
      `INSERT INTO market_bars_daily
         (symbol, trade_date, open, high, low, close, volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (symbol, trade_date) DO UPDATE SET
         open = EXCLUDED.open,
         high = EXCLUDED.high,
         low = EXCLUDED.low,
         close = EXCLUDED.close,
         volume = EXCLUDED.volume`,
      [
        bar.symbol,
        bar.tradeDate,
        bar.open,
        bar.high,
        bar.low,
        bar.close,
        bar.volume,
      ],
    );
    written++;
  }

  return written;
}

async function fetchBarsForSymbol(
  symbol: string,
  companyIds: Map<string, string>,
  verbose: boolean,
): Promise<{ bars: Awaited<ReturnType<typeof fetchYahooDailyBars>>; source: string }> {
  let bars = await fetchYahooDailyBars(symbol, RANGE_DAYS, DELAY_MS, {
    verbose,
    maxAttempts: 3,
  });

  if (bars.length > 0) {
    return { bars, source: "yahoo" };
  }

  if (symbol === "PSEI") {
    return { bars, source: "yahoo" };
  }

  const companyId = companyIds.get(symbol);
  if (!companyId) {
    if (verbose) {
      console.warn(`  [edge] ${symbol}: no companyId in pse-official-universe.json`);
    }
    return { bars, source: "none" };
  }

  const securityId = await fetchPseEdgeSecurityId(companyId, symbol, 80);
  if (!securityId) {
    if (verbose) {
      console.warn(`  [edge] ${symbol}: could not resolve security_id`);
    }
    return { bars, source: "none" };
  }

  bars = await fetchPseEdgeHistoricalBars(
    symbol,
    companyId,
    securityId,
    RANGE_DAYS,
    80,
  );

  if (verbose && bars.length > 0) {
    console.log(`  [edge] ${symbol}: ${bars.length} bars from DisclosureCht.ax`);
  }

  return { bars, source: bars.length > 0 ? "edge" : "none" };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

async function main(): Promise<void> {
  loadMarketEnv();
  assertValidDatabaseUrl();

  const verbose = process.argv.includes("--verbose");
  const probe = parseProbeSymbol();
  const concurrency = parseConcurrency();
  const companyIds = loadCompanyIdBySymbol();

  const allSymbols = loadIngestSymbols();
  const symbols = probe
    ? allSymbols.filter((s) => s === probe || s === probe.replace(/\.PS$/i, ""))
    : allSymbols;

  if (probe && symbols.length === 0) {
    throw new Error(`--probe=${probe} not in PSE universe`);
  }

  console.log(
    `Fetching ${RANGE_DAYS}d bars for ${symbols.length} symbol(s) (delay ${DELAY_MS}ms, concurrency ${concurrency})...`,
  );

  const barsPerSymbol = new Map<string, number>();
  const sourcePerSymbol = new Map<string, string>();
  let totalBars = 0;

  await mapPool(symbols, concurrency, async (symbol, i) => {
    const { bars, source } = await fetchBarsForSymbol(symbol, companyIds, verbose);
    const written = await upsertBars(bars);
    barsPerSymbol.set(symbol, written);
    sourcePerSymbol.set(symbol, source);
    totalBars += written;
    console.log(
      `  ${symbol}: ${written} bars (${source}) (${i + 1}/${symbols.length})`,
    );
  });

  console.log(`Done. Upserted ${totalBars} bar rows.`);

  if (probe) {
    await closeIngestPool();
    return;
  }

  const pseiBars = barsPerSymbol.get("PSEI") ?? 0;
  if (pseiBars === 0) {
    console.error(
      "Bar ingest failed: no PSEI rows (required for dashboard chart). Retry ingest:bars.",
    );
    await closeIngestPool();
    process.exit(1);
  }

  const equityWithBars = symbols.filter(
    (s) => s !== "PSEI" && (barsPerSymbol.get(s) ?? 0) > 0,
  ).length;
  if (equityWithBars < MIN_EQUITY_SYMBOLS_WARN) {
    console.warn(
      `WARN: only ${equityWithBars} equities have bars (expected ~${MIN_EQUITY_SYMBOLS_WARN}+).`,
    );
  }

  const equityMissing = symbols.filter(
    (s) => s !== "PSEI" && (barsPerSymbol.get(s) ?? 0) === 0,
  );
  if (equityMissing.length > 0 && equityMissing.length <= 20) {
    console.warn(`No bars for: ${equityMissing.join(", ")}`);
  } else if (equityMissing.length > 20) {
    console.warn(`No bars for ${equityMissing.length} symbols (use --verbose for details)`);
  }

  const edgeCount = [...sourcePerSymbol.values()].filter((s) => s === "edge").length;
  const yahooCount = [...sourcePerSymbol.values()].filter((s) => s === "yahoo").length;
  console.log(`Sources: ${yahooCount} yahoo, ${edgeCount} edge`);

  await closeIngestPool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
