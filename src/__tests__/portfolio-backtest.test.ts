import { describe, expect, it } from "vitest";

import {
  aggregatePortfolioMetrics,
  bestPortfolioModel,
} from "@/lib/forecast/backtest";
import type { ModelMetrics } from "@/lib/forecast/types";

function metric(overrides: Partial<ModelMetrics> = {}): ModelMetrics {
  return {
    model: "naive",
    horizonDays: 7,
    mae: 1,
    rmse: 1,
    mape: 1,
    dirAccuracy: 50,
    ...overrides,
  };
}

describe("aggregatePortfolioMetrics", () => {
  it("averages metrics across tickers per model", () => {
    const tickerA: ModelMetrics[] = [
      metric({ model: "naive", mae: 2, rmse: 3, mape: 4, dirAccuracy: 60 }),
      metric({ model: "ma", mae: 1, rmse: 1, mape: 1, dirAccuracy: 40 }),
    ];
    const tickerB: ModelMetrics[] = [
      metric({ model: "naive", mae: 4, rmse: 5, mape: 6, dirAccuracy: 80 }),
      metric({ model: "ma", mae: 3, rmse: 3, mape: 3, dirAccuracy: 60 }),
    ];

    const result = aggregatePortfolioMetrics([tickerA, tickerB], 7);
    const naive = result.find((r) => r.model === "naive");
    const ma = result.find((r) => r.model === "ma");

    expect(naive).toMatchObject({
      avgMae: 3,
      avgRmse: 4,
      avgMape: 5,
      avgDirAccuracy: 70,
      tickerCount: 2,
    });
    expect(ma).toMatchObject({
      avgMae: 2,
      avgRmse: 2,
      avgMape: 2,
      avgDirAccuracy: 50,
      tickerCount: 2,
    });
  });

  it("excludes a ticker with insufficient bars (empty metrics array) without skewing the average", () => {
    const tickerA: ModelMetrics[] = [metric({ model: "naive", mae: 2 })];
    const tickerBInsufficientBars: ModelMetrics[] = [];

    const result = aggregatePortfolioMetrics(
      [tickerA, tickerBInsufficientBars],
      7,
    );
    const naive = result.find((r) => r.model === "naive");

    expect(naive?.avgMae).toBe(2);
    expect(naive?.tickerCount).toBe(1);
  });

  it("averages dirAccuracy only over tickers where it isn't null", () => {
    const tickerA: ModelMetrics[] = [
      metric({ model: "naive", dirAccuracy: 80 }),
    ];
    const tickerB: ModelMetrics[] = [
      metric({ model: "naive", dirAccuracy: null }),
    ];

    const result = aggregatePortfolioMetrics([tickerA, tickerB], 7);
    const naive = result.find((r) => r.model === "naive");

    expect(naive?.avgDirAccuracy).toBe(80);
    expect(naive?.tickerCount).toBe(2);
  });

  it("excludes lstm rows (not a portfolio-supported baseline model)", () => {
    const tickerA: ModelMetrics[] = [metric({ model: "lstm", mae: 999 })];

    const result = aggregatePortfolioMetrics([tickerA], 7);

    expect(result).toEqual([]);
  });

  it("returns [] for empty input", () => {
    expect(aggregatePortfolioMetrics([], 7)).toEqual([]);
  });
});

describe("bestPortfolioModel", () => {
  it("returns null for empty input", () => {
    expect(bestPortfolioModel([])).toBeNull();
  });

  it("picks the model with lowest avgMape, even when avgMae disagrees", () => {
    // Model "naive" has the lowest raw MAE (peso terms) but the highest
    // MAPE, because it's fit on a cheap ticker where a small peso error is
    // a large percentage error. "linear" has a higher MAE (fit on an
    // expensive ticker) but a much lower MAPE. Portfolio best-model
    // selection should prefer "linear" here — proving MAE-based selection
    // would give the wrong answer for cross-ticker comparison.
    const result = aggregatePortfolioMetrics(
      [
        [metric({ model: "naive", mae: 0.5, mape: 30 })], // cheap ticker, e.g. ~₱1.63
        [metric({ model: "linear", mae: 10, mape: 2 })], // expensive ticker, e.g. ~₱2000
      ],
      7,
    );

    const best = bestPortfolioModel(result);
    expect(best?.model).toBe("linear");
  });
});
