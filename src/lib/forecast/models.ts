import type { BaselineModel } from "@/lib/forecast/types";

/** Last close repeated for each future step. */
export function naivePredict(closes: number[], horizonDays: number): number[] {
  const last = closes.at(-1) ?? 0;
  return Array.from({ length: horizonDays }, () => last);
}

/** SMA extrapolation: extend last SMA(window) flat. */
export function maPredict(
  closes: number[],
  horizonDays: number,
  window = 20,
): number[] {
  const tail = closes.slice(-window);
  const avg = tail.length ? tail.reduce((a, b) => a + b, 0) / tail.length : 0;
  return Array.from({ length: horizonDays }, () => avg);
}

/** OLS on last N closes; project one step at a time (rolling). */
export function linearPredict(
  closes: number[],
  horizonDays: number,
  lookback = 30,
): number[] {
  const history = [...closes];
  const out: number[] = [];

  for (let h = 0; h < horizonDays; h++) {
    const slice = history.slice(-lookback);
    const pred = linearRegressionNext(slice);
    out.push(pred);
    history.push(pred);
  }

  return out;
}

function linearRegressionNext(closes: number[]): number {
  if (closes.length < 2) return closes.at(-1) ?? 0;
  const n = closes.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = closes.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - xMean) * (closes[i]! - yMean);
    den += (xs[i]! - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return intercept + slope * n;
}

/**
 * param overrides the model's tunable setting (ma: window, linear: lookback).
 * Ignored by naive, which has no tunable parameter.
 */
export function predictWithModel(
  model: BaselineModel,
  closes: number[],
  horizonDays: number,
  param?: number,
): number[] {
  switch (model) {
    case "naive":
      return naivePredict(closes, horizonDays);
    case "ma":
      return maPredict(closes, horizonDays, param);
    case "linear":
      return linearPredict(closes, horizonDays, param);
    default:
      return naivePredict(closes, horizonDays);
  }
}

/**
 * Single-layer LSTM-flavored cell, ported line-for-line from
 * services/forecast/forecast/lstm.py — the same script the offline
 * `--lstm` ingestion pipeline runs via a python3 subprocess. Deliberately
 * simplistic (only wx is trained; wh never updates; no real gate
 * mechanics) — that mirrors the Python reference intentionally rather
 * than "improving" it, so this stays the same model, just runnable
 * in-process. That matters because Vercel's Node serverless runtime can't
 * spawn python3, so this was previously silently substituted with Linear
 * Regression on every live request.
 */
class TinyLstm {
  private readonly hiddenSize: number;
  private wh: number[][];
  private wx: number[];
  private h: number[];

  constructor(hiddenSize = 8) {
    this.hiddenSize = hiddenSize;
    this.wh = Array.from({ length: hiddenSize }, (_, i) =>
      Array.from({ length: hiddenSize }, (_, j) => 0.01 * (i + j)),
    );
    this.wx = Array.from({ length: hiddenSize }, () => 0.01);
    this.h = Array.from({ length: hiddenSize }, () => 0);
  }

  private step(x: number): number {
    const newH = this.h.map((_, i) => {
      let s = this.wx[i]! * x;
      for (let j = 0; j < this.hiddenSize; j++) {
        s += this.wh[i]![j]! * this.h[j]!;
      }
      return Math.tanh(s);
    });
    this.h = newH;
    return this.h.reduce((a, b) => a + b, 0) / this.h.length;
  }

  private fit(series: number[], epochs = 30): void {
    if (series.length < 10) return;
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    const variance =
      series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length;
    const std = Math.sqrt(variance) || 1;
    const norm = series.map((x) => (x - mean) / std);
    const lr = 0.05;

    for (let epoch = 0; epoch < epochs; epoch++) {
      this.h = Array.from({ length: this.hiddenSize }, () => 0);
      for (let t = 0; t < norm.length - 1; t++) {
        const pred = this.step(norm[t]!);
        const err = norm[t + 1]! - pred;
        for (let i = 0; i < this.hiddenSize; i++) {
          this.wx[i]! += lr * err * norm[t]!;
        }
      }
    }
  }

  predict(series: number[], horizon: number): number[] {
    if (series.length < 2) {
      const last = series.at(-1) ?? 0;
      return Array.from({ length: horizon }, () => last);
    }

    this.fit(series);
    const work = [...series];
    const out: number[] = [];
    for (let step = 0; step < horizon; step++) {
      const window = work.slice(-20);
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const variance =
        window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
      const std = Math.sqrt(variance) || 1;
      const last = work.at(-1)!;
      const x = (last - mean) / std;
      const delta = this.step(x) * std;
      const next = Math.max(last + delta * 0.3, 0.01);
      const rounded = Math.round(next * 10000) / 10000;
      out.push(rounded);
      work.push(rounded);
    }
    return out;
  }
}

/**
 * Live single-shot LSTM forecast for the interactive stock chart. A fresh
 * model is fit and predicted once per call — not the same use case as
 * walk-forward backtesting, which stays baseline-model-only in
 * backtest.ts since refitting 30 epochs per backtest step would be too
 * slow for a request (that's also why predictWithModel's type excludes
 * "lstm" — this is intentionally a separate, narrower entry point).
 */
export function lstmPredict(closes: number[], horizonDays: number): number[] {
  return new TinyLstm().predict(closes, horizonDays);
}
