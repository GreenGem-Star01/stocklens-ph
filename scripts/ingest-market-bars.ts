/**
 * Daily OHLCV ingest for analyzed tickers → market_bars_daily
 * Run: npm run ingest:bars
 * Flags: --verbose (per-symbol diagnostics), --probe=BDO (fetch one symbol only)
 *
 * PSEi: Yahoo chart API. Equities: Yahoo often empty (.PS = indices only on Yahoo);
 * falls back to PSE EDGE DisclosureCht.ax historical OHLCV.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_STOCK_SEEDS } from "../src/lib/data/stock-seeds";
import { closeIngestPool, getIngestPool } from "./lib/db-ingest";
import { assertValidDatabaseUrl, loadMarketEnv } from "./lib/load-market-env";
import {
  fetchPseEdgeHistoricalBars,
  fetchPseEdgeSecurityId,
} from "./market/pse-edge-bars";
import { fetchYahooDailyBars } from "./market/yahoo-eod";

const RANGE_DAYS = 400;
const DELAY_MS = 700;

type UniverseCompany = {
  symbol: string;
  companyId?: string;
};

function loadCompanyIdBySymbol(): Map<string, string> {
  const path = join(process.cwd(), "data/pse-official-universe.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    companies?: UniverseCompany[];
    indices?: UniverseCompany[];
  };
  const map = new Map<string, string>();
  for (const row of [...(raw.companies ?? []), ...(raw.indices ?? [])]) {
    if (row.companyId) {
      map.set(row.symbol.toUpperCase(), row.companyId);
    }
  }
  return map;
}

function parseProbeSymbol(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--probe="));
  if (!arg) return null;
  return arg.split("=")[1]?.trim().toUpperCase() ?? null;
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

function orderSymbols(symbols: string[]): string[] {
  const psei = symbols.filter((s) => s === "PSEI");
  const rest = symbols.filter((s) => s !== "PSEI");
  return [...psei, ...rest];
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

async function main(): Promise<void> {
  loadMarketEnv();
  assertValidDatabaseUrl();

  const verbose = process.argv.includes("--verbose");
  const probe = parseProbeSymbol();
  const companyIds = loadCompanyIdBySymbol();

  const allSymbols = ALL_STOCK_SEEDS.map((s) =>
    s.ticker.replace(/\.PS$/i, ""),
  );
  const symbols = probe
    ? allSymbols.filter((s) => s === probe || s === probe.replace(/\.PS$/i, ""))
    : orderSymbols(allSymbols);

  if (probe && symbols.length === 0) {
    throw new Error(`--probe=${probe} not in analyzed seed list`);
  }

  console.log(
    `Fetching ${RANGE_DAYS}d bars for ${symbols.length} symbol(s) (delay ${DELAY_MS}ms)...`,
  );

  const barsPerSymbol = new Map<string, number>();
  const sourcePerSymbol = new Map<string, string>();
  let totalBars = 0;

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]!;
    const { bars, source } = await fetchBarsForSymbol(
      symbol,
      companyIds,
      verbose,
    );
    const written = await upsertBars(bars);
    barsPerSymbol.set(symbol, written);
    sourcePerSymbol.set(symbol, source);
    totalBars += written;
    console.log(
      `  ${symbol}: ${written} bars (${source}) (${i + 1}/${symbols.length})`,
    );
  }

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

  const equityMissing = symbols.filter(
    (s) => s !== "PSEI" && (barsPerSymbol.get(s) ?? 0) === 0,
  );
  if (equityMissing.length > 0) {
    console.warn(
      `No bars for: ${equityMissing.join(", ")}. Stock pages use seed chart fallback.`,
    );
    console.warn("Retry: npm run ingest:bars -- --verbose");
  }

  const edgeCount = [...sourcePerSymbol.values()].filter((s) => s === "edge")
    .length;
  const yahooCount = [...sourcePerSymbol.values()].filter((s) => s === "yahoo")
    .length;
  console.log(`Sources: ${yahooCount} yahoo, ${edgeCount} edge`);

  await closeIngestPool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
