import { predictWithModel } from "@/lib/forecast/models";
import {
  BASELINE_MODELS,
  type BaselineModel,
  type ModelComparisonRow,
  type ModelMetrics,
  type PortfolioModelMetrics,
} from "@/lib/forecast/types";
import type { MarketBar } from "@/lib/market/types";

const DEFAULT_MODELS: BaselineModel[] = ["naive", "ma", "linear"];
const MIN_HISTORY = 60;
const WALK_FORWARD_DAYS = 90;

function closesFromBars(bars: MarketBar[]): number[] {
  return [...bars]
    .sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))
    .map((b) => Number(b.close));
}

function mae(actual: number[], predicted: number[]): number {
  if (!actual.length) return 0;
  return (
    actual.reduce((sum, a, i) => sum + Math.abs(a - predicted[i]!), 0) /
    actual.length
  );
}

function rmse(actual: number[], predicted: number[]): number {
  if (!actual.length) return 0;
  const mse =
    actual.reduce((sum, a, i) => sum + (a - predicted[i]!) ** 2, 0) /
    actual.length;
  return Math.sqrt(mse);
}

function mape(actual: number[], predicted: number[]): number {
  const pairs = actual
    .map((a, i) => ({ a, p: predicted[i]! }))
    .filter(({ a }) => a !== 0);
  if (!pairs.length) return 0;
  return (
    (pairs.reduce((sum, { a, p }) => sum + Math.abs((a - p) / a), 0) /
      pairs.length) *
    100
  );
}

function directionalAccuracy(actual: number[], predicted: number[]): number | null {
  if (actual.length < 2) return null;
  let correct = 0;
  let total = 0;
  for (let i = 1; i < actual.length; i++) {
    const actualDir = actual[i]! - actual[i - 1]!;
    const predDir = predicted[i]! - actual[i - 1]!;
    if (actualDir === 0 && predDir === 0) {
      correct++;
      total++;
      continue;
    }
    if (actualDir === 0 || predDir === 0) continue;
    if (Math.sign(actualDir) === Math.sign(predDir)) correct++;
    total++;
  }
  return total ? (correct / total) * 100 : null;
}

/**
 * param overrides the tunable setting (ma: window, linear: lookback) for
 * every model in `models`. Intended for a single-element `models` array —
 * a shared param across naive+ma+linear together wouldn't be meaningful,
 * since naive has none and ma/linear's params aren't the same kind of value.
 */
export function walkForwardBacktest(
  bars: MarketBar[],
  horizonDays: number,
  models: BaselineModel[] = DEFAULT_MODELS,
  param?: number,
): ModelMetrics[] {
  const closes = closesFromBars(bars);
  if (closes.length < MIN_HISTORY) return [];

  const window = closes.slice(-WALK_FORWARD_DAYS);
  const results: ModelMetrics[] = [];

  for (const model of models) {
    const actuals: number[] = [];
    const preds: number[] = [];

    for (let i = MIN_HISTORY; i < window.length; i++) {
      const train = window.slice(0, i);
      const targetIdx = i + horizonDays - 1;
      if (targetIdx >= window.length) break;
      const forecast = predictWithModel(model, train, horizonDays, param);
      actuals.push(window[targetIdx]!);
      preds.push(forecast[horizonDays - 1]!);
    }

    if (!actuals.length) continue;

    results.push({
      model,
      horizonDays,
      mae: mae(actuals, preds),
      rmse: rmse(actuals, preds),
      mape: mape(actuals, preds),
      dirAccuracy: directionalAccuracy(actuals, preds),
    });
  }

  return results;
}

export function metricsToComparisonRows(
  metrics: ModelMetrics[],
): ModelComparisonRow[] {
  if (!metrics.length) return [];
  const bestMae = Math.min(...metrics.map((m) => m.mae));
  return metrics.map((m) => ({
    model: m.model.toUpperCase(),
    mae: m.mae.toFixed(2),
    rmse: m.rmse.toFixed(2),
    mape: `${m.mape.toFixed(1)}%`,
    dirAccuracy: m.dirAccuracy != null ? `${m.dirAccuracy.toFixed(1)}%` : null,
    best: m.mae === bestMae,
  }));
}

export function bestModelMetrics(metrics: ModelMetrics[]): ModelMetrics | null {
  if (!metrics.length) return null;
  return metrics.reduce((best, m) => (m.mae < best.mae ? m : best));
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Aggregates per-ticker walkForwardBacktest results (one array per ticker)
 * into portfolio-level averages per model. A ticker with insufficient bars
 * contributes [] from walkForwardBacktest and is naturally excluded here.
 */
export function aggregatePortfolioMetrics(
  perTickerMetrics: ModelMetrics[][],
  horizonDays: number,
): PortfolioModelMetrics[] {
  const byModel = new Map<BaselineModel, ModelMetrics[]>();

  for (const tickerMetrics of perTickerMetrics) {
    for (const m of tickerMetrics) {
      if (m.model === "lstm") continue;
      const rows = byModel.get(m.model) ?? [];
      rows.push(m);
      byModel.set(m.model, rows);
    }
  }

  const results: PortfolioModelMetrics[] = [];
  for (const model of BASELINE_MODELS) {
    const rows = byModel.get(model);
    if (!rows || !rows.length) continue;

    const dirRows = rows.filter(
      (r): r is ModelMetrics & { dirAccuracy: number } => r.dirAccuracy != null,
    );

    results.push({
      model,
      horizonDays,
      avgMae: average(rows.map((r) => r.mae)),
      avgRmse: average(rows.map((r) => r.rmse)),
      avgMape: average(rows.map((r) => r.mape)),
      avgDirAccuracy: dirRows.length
        ? average(dirRows.map((r) => r.dirAccuracy))
        : null,
      tickerCount: rows.length,
    });
  }

  return results;
}

/**
 * Picks the best-fit model across a portfolio by lowest average MAPE, not
 * MAE. Raw MAE is peso-denominated, so averaging it across tickers at very
 * different price levels (e.g. ₱1.63 vs ₱2000) would let one expensive
 * ticker dominate — MAPE normalizes for that. bestModelMetrics (MAE-based)
 * is still correct for the single-ticker case, where the price scale is
 * fixed.
 */
export function bestPortfolioModel(
  metrics: PortfolioModelMetrics[],
): PortfolioModelMetrics | null {
  if (!metrics.length) return null;
  return metrics.reduce((best, m) => (m.avgMape < best.avgMape ? m : best));
}
