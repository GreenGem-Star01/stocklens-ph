import { describe, expect, it } from "vitest";

import { walkForwardBacktest } from "@/lib/forecast/backtest";
import { generateForecast } from "@/lib/forecast/generate";
import { linearPredict, naivePredict } from "@/lib/forecast/models";
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
