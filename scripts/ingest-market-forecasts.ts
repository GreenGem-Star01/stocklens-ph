/**
 * Baseline forecast + walk-forward metrics ingest → market_forecasts_latest / market_model_metrics
 * Run: npm run ingest:forecasts
 * Flags: --write-snapshot, --probe=BDO, --verbose
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { walkForwardBacktest, bestModelMetrics } from "../src/lib/forecast/backtest";
import { generateForecast } from "../src/lib/forecast/generate";
import {
  BASELINE_MODELS,
  FORECAST_HORIZONS,
  type ForecastModel,
} from "../src/lib/forecast/types";
import { closeIngestPool, getIngestPool } from "./lib/db-ingest";
import { assertValidDatabaseUrl, loadMarketEnv } from "./lib/load-market-env";
import { loadIngestSymbols } from "./lib/universe-symbols";

const MIN_BARS = 60;
const BAR_LOOKBACK = 400;

type BarRow = {
  symbol: string;
  trade_date: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string | null;
};

function parseProbeSymbol(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--probe="));
  if (!arg) return null;
  return arg.split("=")[1]?.trim().toUpperCase() ?? null;
}

async function fetchBarsForSymbol(symbol: string) {
  const pool = getIngestPool();
  const rows = await pool.query<BarRow>(
    `SELECT symbol, trade_date, open, high, low, close, volume
     FROM market_bars_daily
     WHERE symbol = $1
     ORDER BY trade_date DESC
     LIMIT $2`,
    [symbol, BAR_LOOKBACK],
  );

  return rows.rows
    .map((row) => ({
      symbol: row.symbol,
      tradeDate:
        row.trade_date instanceof Date
          ? row.trade_date.toISOString().slice(0, 10)
          : String(row.trade_date).slice(0, 10),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: row.volume != null ? Number(row.volume) : null,
    }))
    .reverse();
}

async function upsertForecast(
  symbol: string,
  model: ForecastModel,
  horizonDays: number,
  points: unknown,
): Promise<void> {
  const pool = getIngestPool();
  await pool.query(
    `INSERT INTO market_forecasts_latest (symbol, model, horizon_days, generated_at, points)
     VALUES ($1, $2, $3, NOW(), $4::jsonb)
     ON CONFLICT (symbol, model, horizon_days) DO UPDATE SET
       generated_at = EXCLUDED.generated_at,
       points = EXCLUDED.points`,
    [symbol, model, horizonDays, JSON.stringify(points)],
  );
}

async function upsertMetrics(
  symbol: string,
  model: ForecastModel,
  horizonDays: number,
  mae: number,
  rmse: number,
  mape: number,
  dirAccuracy: number | null,
): Promise<void> {
  const pool = getIngestPool();
  await pool.query(
    `INSERT INTO market_model_metrics
       (symbol, model, horizon_days, mae, rmse, mape, dir_accuracy, computed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (symbol, model, horizon_days) DO UPDATE SET
       mae = EXCLUDED.mae,
       rmse = EXCLUDED.rmse,
       mape = EXCLUDED.mape,
       dir_accuracy = EXCLUDED.dir_accuracy,
       computed_at = EXCLUDED.computed_at`,
    [symbol, model, horizonDays, mae, rmse, mape, dirAccuracy],
  );
}

async function runLstmForSymbol(
  symbol: string,
  bars: Awaited<ReturnType<typeof fetchBarsForSymbol>>,
): Promise<void> {
  const { spawnSync } = await import("node:child_process");
  const closes = bars.map((b) => b.close);
  const script = join(process.cwd(), "services/forecast/forecast/lstm.py");
  const result = spawnSync(
    "python3",
    [script, "--closes", JSON.stringify(closes), "--horizon", "7"],
    { encoding: "utf8", timeout: 120_000 },
  );

  if (result.status !== 0) {
    console.warn(`  [lstm] ${symbol}: ${result.stderr || "failed"}`);
    return;
  }

  try {
    const payload = JSON.parse(result.stdout) as {
      horizon7: number[];
      horizon30: number[];
      mae: number;
      rmse: number;
      mape: number;
      dirAccuracy: number | null;
    };

    for (const horizonDays of FORECAST_HORIZONS) {
      const prices =
        horizonDays === 7 ? payload.horizon7 : payload.horizon30;
      const points = generateForecast(bars, "lstm", horizonDays);
      const lastHist = points.filter((p) => p.price != null).length;
      for (let i = 0; i < prices.length; i++) {
        const idx = lastHist + i;
        if (points[idx]) points[idx]!.forecast = prices[i]!;
      }
      await upsertForecast(symbol, "lstm", horizonDays, points);
      await upsertMetrics(
        symbol,
        "lstm",
        horizonDays,
        payload.mae,
        payload.rmse,
        payload.mape,
        payload.dirAccuracy,
      );
    }
    console.log(`  [lstm] ${symbol}: OK`);
  } catch (err) {
    console.warn(`  [lstm] ${symbol}: parse error`, err);
  }
}

async function main(): Promise<void> {
  loadMarketEnv();
  assertValidDatabaseUrl();

  const verbose = process.argv.includes("--verbose");
  const writeSnapshot = process.argv.includes("--write-snapshot");
  const runLstm = process.argv.includes("--lstm");
  const probe = parseProbeSymbol();

  const symbols = probe
    ? [probe]
    : loadIngestSymbols();

  console.log(`Computing forecasts for ${symbols.length} symbol(s)...`);

  const snapshotForecasts: Array<{
    symbol: string;
    model: string;
    horizonDays: number;
    generatedAt: string;
    points: unknown;
  }> = [];
  const snapshotMetrics: Array<{
    symbol: string;
    model: string;
    horizonDays: number;
    mae: number;
    rmse: number;
    mape: number;
    dirAccuracy: number | null;
    computedAt: string;
  }> = [];

  let processed = 0;
  let skipped = 0;

  for (const symbol of symbols) {
    const bars = await fetchBarsForSymbol(symbol);
    if (bars.length < MIN_BARS) {
      skipped++;
      if (verbose) console.log(`  ${symbol}: skip (${bars.length} bars)`);
      continue;
    }

    for (const horizonDays of FORECAST_HORIZONS) {
      const metrics = walkForwardBacktest(bars, horizonDays);
      for (const m of metrics) {
        await upsertMetrics(
          symbol,
          m.model,
          horizonDays,
          m.mae,
          m.rmse,
          m.mape,
          m.dirAccuracy,
        );
        snapshotMetrics.push({
          symbol,
          model: m.model,
          horizonDays,
          mae: m.mae,
          rmse: m.rmse,
          mape: m.mape,
          dirAccuracy: m.dirAccuracy,
          computedAt: new Date().toISOString(),
        });
      }

      for (const model of BASELINE_MODELS) {
        const points = generateForecast(bars, model, horizonDays);
        await upsertForecast(symbol, model, horizonDays, points);
        snapshotForecasts.push({
          symbol,
          model,
          horizonDays,
          generatedAt: new Date().toISOString(),
          points,
        });
      }
    }

    if (runLstm) {
      await runLstmForSymbol(symbol, bars);
    }

    processed++;
    const best = bestModelMetrics(walkForwardBacktest(bars, 7));
    console.log(
      `  ${symbol}: OK (${bars.length} bars, best=${best?.model ?? "n/a"}) (${processed}/${symbols.length})`,
    );
  }

  console.log(`Done. Processed ${processed}, skipped ${skipped} (insufficient bars).`);

  if (writeSnapshot) {
    const out = join(process.cwd(), "data/market-forecasts-snapshot.json");
    writeFileSync(
      out,
      JSON.stringify(
        {
          asOf: new Date().toISOString(),
          forecasts: snapshotForecasts,
          metrics: snapshotMetrics,
        },
        null,
        2,
      ),
    );
    console.log(`Wrote ${out}`);
  }

  await closeIngestPool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
