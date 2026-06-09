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

export function predictWithModel(
  model: BaselineModel,
  closes: number[],
  horizonDays: number,
): number[] {
  switch (model) {
    case "naive":
      return naivePredict(closes, horizonDays);
    case "ma":
      return maPredict(closes, horizonDays);
    case "linear":
      return linearPredict(closes, horizonDays);
    default:
      return naivePredict(closes, horizonDays);
  }
}
