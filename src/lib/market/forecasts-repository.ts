import { unstable_cache } from "next/cache";

import { query } from "@/lib/db/client";
import { isDbMarketEnabled } from "@/lib/db/config";
import type { ForecastModel } from "@/lib/forecast/types";
import { tickerToSymbol } from "@/lib/market/symbol";
import type { ChartPoint } from "@/lib/types/stock-analysis";

type ForecastRow = {
  symbol: string;
  model: string;
  horizon_days: number;
  generated_at: Date;
  points: ChartPoint[];
};

type MetricsRow = {
  symbol: string;
  model: string;
  horizon_days: number;
  mae: string;
  rmse: string;
  mape: string;
  dir_accuracy: string | null;
  computed_at: Date;
};

export type StoredModelMetrics = {
  model: ForecastModel;
  horizonDays: number;
  mae: number;
  rmse: number;
  mape: number;
  dirAccuracy: number | null;
  computedAt: Date;
};

export async function fetchForecastPoints(
  ticker: string,
  model: ForecastModel,
  horizonDays: number,
): Promise<ChartPoint[] | null> {
  if (!isDbMarketEnabled()) return null;

  const symbol = tickerToSymbol(ticker);
  const rows = await query<ForecastRow>(
    `SELECT symbol, model, horizon_days, generated_at, points
     FROM market_forecasts_latest
     WHERE symbol = $1 AND model = $2 AND horizon_days = $3
     LIMIT 1`,
    [symbol, model, horizonDays],
  );

  const row = rows[0];
  if (!row) return null;
  return Array.isArray(row.points) ? row.points : null;
}

export async function getForecastPoints(
  ticker: string,
  model: ForecastModel,
  horizonDays: number,
): Promise<ChartPoint[] | null> {
  if (!isDbMarketEnabled()) return null;

  const symbol = tickerToSymbol(ticker);
  return unstable_cache(
    () => fetchForecastPoints(ticker, model, horizonDays),
    ["market-forecast", symbol, model, String(horizonDays)],
    { revalidate: 300, tags: [`market-forecast:${symbol}`] },
  )();
}

export async function fetchModelMetrics(
  ticker: string,
  horizonDays: number,
): Promise<StoredModelMetrics[]> {
  if (!isDbMarketEnabled()) return [];

  const symbol = tickerToSymbol(ticker);
  const rows = await query<MetricsRow>(
    `SELECT symbol, model, horizon_days, mae, rmse, mape, dir_accuracy, computed_at
     FROM market_model_metrics
     WHERE symbol = $1 AND horizon_days = $2
     ORDER BY mae ASC`,
    [symbol, horizonDays],
  );

  return rows.map((row) => ({
    model: row.model as ForecastModel,
    horizonDays: row.horizon_days,
    mae: Number(row.mae),
    rmse: Number(row.rmse),
    mape: Number(row.mape),
    dirAccuracy: row.dir_accuracy != null ? Number(row.dir_accuracy) : null,
    computedAt: row.computed_at,
  }));
}

export async function getModelMetrics(
  ticker: string,
  horizonDays: number,
): Promise<StoredModelMetrics[]> {
  if (!isDbMarketEnabled()) return [];

  const symbol = tickerToSymbol(ticker);
  return unstable_cache(
    () => fetchModelMetrics(ticker, horizonDays),
    ["market-metrics", symbol, String(horizonDays)],
    { revalidate: 300, tags: [`market-metrics:${symbol}`] },
  )();
}

export async function fetchAllForecastSymbols(): Promise<string[]> {
  if (!isDbMarketEnabled()) return [];

  const rows = await query<{ symbol: string }>(
    `SELECT DISTINCT symbol FROM market_forecasts_latest ORDER BY symbol`,
  );
  return rows.map((r) => r.symbol);
}
