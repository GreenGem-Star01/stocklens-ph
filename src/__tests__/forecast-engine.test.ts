import { describe, expect, it } from "vitest";

import { walkForwardBacktest } from "@/lib/forecast/backtest";
import { generateForecast } from "@/lib/forecast/generate";
import {
  linearPredict,
  lstmPredict,
  maPredict,
  naivePredict,
  predictWithModel,
} from "@/lib/forecast/models";
import type { MarketBar } from "@/lib/market/types";

function syntheticBars(n: number): MarketBar[] {
  return Array.from({ length: n }, (_, i) => {
    const close = 100 + i * 0.5 + Math.sin(i / 5);
    const day = String((i % 28) + 1).padStart(2, "0");
    return {
      symbol: "TEST",
      tradeDate: `2025-01-${day}`,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1000,
    };
  });
}

describe("forecast models", () => {
  it("naive repeats last close", () => {
    const closes = [10, 11, 12, 13];
    expect(naivePredict(closes, 3)).toEqual([13, 13, 13]);
  });

  it("linear extrapolates upward trend", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const preds = linearPredict(closes, 3);
    expect(preds[0]).toBeGreaterThan(closes.at(-1)!);
  });

  it("generateForecast includes history and future points", () => {
    const bars = syntheticBars(80);
    const points = generateForecast(bars, "ma", 7);
    const forecasts = points.filter((p) => p.forecast != null);
    const prices = points.filter((p) => p.price != null);
    expect(prices.length).toBeGreaterThan(0);
    expect(forecasts.length).toBe(7);
  });

  it("walk-forward backtest returns metrics per model", () => {
    const bars = syntheticBars(120);
    const metrics = walkForwardBacktest(bars, 7);
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0]?.mae).toBeGreaterThanOrEqual(0);
  });
});

// Regression coverage for a bug where the live forecast API silently
// substituted Linear Regression for every "lstm" request — Vercel's Node
// serverless runtime can't spawn the python3 subprocess the offline
// ingestion pipeline uses, so lstmPredict is a from-scratch TypeScript
// port of that same algorithm (services/forecast/forecast/lstm.py),
// verified against the Python reference for a fixed input. These tests
// pin the port's basic contract, and specifically that generateForecast
// no longer routes "lstm" through the linear model.
describe("lstm model", () => {
  const trendingCloses = Array.from({ length: 60 }, (_, i) => 100 + i * 0.3);

  it("returns exactly horizonDays predictions", () => {
    expect(lstmPredict(trendingCloses, 7)).toHaveLength(7);
    expect(lstmPredict(trendingCloses, 30)).toHaveLength(30);
  });

  it("falls back to repeating the last close for too-short series", () => {
    expect(lstmPredict([42], 3)).toEqual([42, 42, 42]);
    expect(lstmPredict([], 3)).toEqual([0, 0, 0]);
  });

  it("is deterministic for the same input", () => {
    expect(lstmPredict(trendingCloses, 7)).toEqual(
      lstmPredict(trendingCloses, 7),
    );
  });

  it("generateForecast('lstm') differs from generateForecast('linear')", () => {
    const bars = syntheticBars(90);
    const lstmPoints = generateForecast(bars, "lstm", 7);
    const linearPoints = generateForecast(bars, "linear", 7);
    const lstmForecast = lstmPoints.find((p) => p.forecast != null)?.forecast;
    const linearForecast = linearPoints.find((p) => p.forecast != null)
      ?.forecast;
    expect(lstmForecast).not.toEqual(linearForecast);
  });
});

describe("configurable model parameters", () => {
  const trendingCloses = Array.from({ length: 60 }, (_, i) => 100 + i);

  it("maPredict with a custom window differs from the default", () => {
    const short = maPredict(trendingCloses, 1, 5);
    const long = maPredict(trendingCloses, 1, 50);
    // ascending trend: a short SMA sits closer to the recent (higher) tail
    // than a long SMA averaged over much more of the series
    expect(short[0]).toBeGreaterThan(long[0]!);
  });

  it("linearPredict with a custom lookback differs from the default", () => {
    // a perfectly linear series fits the same regression line regardless of
    // window size, so use a curved series where lookback actually matters
    const curvedCloses = Array.from(
      { length: 60 },
      (_, i) => 100 + i * 0.5 + Math.sin(i / 4) * 8,
    );
    const defaultLookback = linearPredict(curvedCloses, 1);
    const shortLookback = linearPredict(curvedCloses, 1, 5);
    expect(shortLookback[0]).not.toBeCloseTo(defaultLookback[0]!, 5);
  });

  it("predictWithModel passes param through for ma/linear, ignores it for naive", () => {
    const withParam = predictWithModel("ma", trendingCloses, 1, 5);
    const withoutParam = predictWithModel("ma", trendingCloses, 1);
    expect(withParam[0]).not.toEqual(withoutParam[0]);

    const naiveWithParam = predictWithModel("naive", trendingCloses, 1, 5);
    const naiveWithoutParam = predictWithModel("naive", trendingCloses, 1);
    expect(naiveWithParam).toEqual(naiveWithoutParam);
  });

  it("generateForecast with a custom param produces different forecast points", () => {
    const bars = syntheticBars(80);
    const short = generateForecast(bars, "ma", 7, 90, 10);
    const long = generateForecast(bars, "ma", 7, 90, 50);
    const shortForecast = short.find((p) => p.forecast != null)?.forecast;
    const longForecast = long.find((p) => p.forecast != null)?.forecast;
    expect(shortForecast).not.toEqual(longForecast);
  });

  it("walkForwardBacktest with a custom param produces different metrics", () => {
    const bars = syntheticBars(120);
    const defaultMetrics = walkForwardBacktest(bars, 7, ["ma"]);
    const customMetrics = walkForwardBacktest(bars, 7, ["ma"], 5);
    expect(customMetrics[0]?.mae).not.toEqual(defaultMetrics[0]?.mae);
  });
});
