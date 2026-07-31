import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for a bug where getForecastsData() hardcoded
// trend: "Mixed Signal", forecast7d: "—", and modelPerformance: [] for
// every stock regardless of the underlying forecast/metrics data (see the
// forecasts page fix). These mock the DB/snapshot repositories directly so
// the real trend/aggregation logic in db.ts and static.ts runs against
// deterministic fixtures instead of live Postgres or Supabase Storage.

vi.mock("@/lib/market/quotes-repository", () => ({
  getLatestQuotes: vi.fn(),
  getQuotesAsOf: vi.fn(),
}));

vi.mock("@/lib/market/forecasts-repository", () => ({
  fetchAllForecastSymbols: vi.fn(),
  fetchAllModelMetrics: vi.fn(),
  fetchForecastPoints: vi.fn(),
  fetchModelMetrics: vi.fn(),
}));

vi.mock("@/lib/market/quotes-snapshot", () => ({
  getQuotesSnapshot: vi.fn(),
  getQuotesSnapshotAsOf: vi.fn(),
}));

vi.mock("@/lib/market/forecasts-snapshot", () => ({
  getAllForecastsFromSnapshot: vi.fn(),
  getAllMetricsFromSnapshot: vi.fn(),
  getForecastFromSnapshot: vi.fn(),
  getMetricsFromSnapshot: vi.fn(),
}));

import { dbMarketProvider } from "@/lib/api/market-provider/db";
import { staticMarketProvider } from "@/lib/api/market-provider/static";
import { allForecasts, forecastSummary, modelPerformance } from "@/lib/data/forecasts";
import {
  fetchAllForecastSymbols,
  fetchAllModelMetrics,
  fetchForecastPoints,
  fetchModelMetrics,
} from "@/lib/market/forecasts-repository";
import {
  getAllForecastsFromSnapshot,
  getAllMetricsFromSnapshot,
} from "@/lib/market/forecasts-snapshot";
import { getLatestQuotes } from "@/lib/market/quotes-repository";
import { getQuotesSnapshot, getQuotesSnapshotAsOf } from "@/lib/market/quotes-snapshot";
import type { MarketQuote } from "@/lib/market/types";

function quote(lastClose: number): MarketQuote {
  return {
    symbol: "TEST",
    lastClose,
    changePct: 0,
    changeAbs: null,
    volume: null,
    asOf: new Date("2026-07-30T08:00:00.000Z"),
    source: "test",
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("dbMarketProvider.getForecastsData", () => {
  it("computes real per-symbol trend, forecast price, and expected change instead of a hardcoded Mixed Signal", async () => {
    vi.mocked(fetchAllForecastSymbols).mockResolvedValue(["BDO", "MBT"]);
    vi.mocked(getLatestQuotes).mockResolvedValue(
      new Map([
        ["BDO", quote(100)],
        ["MBT", quote(50)],
      ]),
    );
    vi.mocked(fetchForecastPoints).mockImplementation(async (ticker) => {
      if (ticker === "BDO.PS") {
        return [
          { date: "Jul 30", price: 100, forecast: null },
          { date: "Aug 6", price: null, forecast: 110 },
        ];
      }
      if (ticker === "MBT.PS") {
        return [
          { date: "Jul 30", price: 50, forecast: null },
          { date: "Aug 6", price: null, forecast: 45 },
        ];
      }
      return [];
    });
    vi.mocked(fetchModelMetrics).mockImplementation(async (ticker) => {
      if (ticker === "BDO.PS") {
        return [
          { model: "linear", horizonDays: 7, mae: 1, rmse: 1, mape: 1, dirAccuracy: 70, computedAt: new Date() },
        ];
      }
      if (ticker === "MBT.PS") {
        return [
          { model: "linear", horizonDays: 7, mae: 2, rmse: 2, mape: 2, dirAccuracy: 50, computedAt: new Date() },
        ];
      }
      return [];
    });
    vi.mocked(fetchAllModelMetrics).mockResolvedValue([]);

    const result = await dbMarketProvider.getForecastsData();

    const bdo = result.forecasts.find((f) => f.ticker === "BDO.PS");
    expect(bdo).toMatchObject({
      currentPrice: "₱100.00",
      forecast7d: "₱110.00",
      trend: "Projected Upward",
      accuracy: "70.0%",
      expectedChange: "+10.0%",
    });

    const mbt = result.forecasts.find((f) => f.ticker === "MBT.PS");
    expect(mbt).toMatchObject({
      currentPrice: "₱50.00",
      forecast7d: "₱45.00",
      trend: "Projected Downward",
      accuracy: "50.0%",
      expectedChange: "-10.0%",
    });

    expect(result.summary.totalToday).toBe(2);
    expect(result.summary.upwardCount).toBe(1);
    expect(result.summary.upwardPercent).toBe("50%");
    expect(result.summary.averageAccuracy).toBe("60%");
    // Pins that lastUpdated reflects today, not the old fixed "May 16, 2026".
    expect(result.summary.lastUpdated).not.toBe("May 16, 2026");
  });

  it("aggregates model performance across symbols per model instead of returning an empty array", async () => {
    vi.mocked(fetchAllForecastSymbols).mockResolvedValue([]);
    vi.mocked(getLatestQuotes).mockResolvedValue(new Map());
    vi.mocked(fetchAllModelMetrics).mockResolvedValue([
      { model: "naive", horizonDays: 7, mae: 2, rmse: 2, mape: 2, dirAccuracy: 40, computedAt: new Date() },
      { model: "naive", horizonDays: 7, mae: 4, rmse: 4, mape: 4, dirAccuracy: 60, computedAt: new Date() },
      { model: "linear", horizonDays: 7, mae: 1, rmse: 1, mape: 1, dirAccuracy: 60, computedAt: new Date() },
      { model: "linear", horizonDays: 7, mae: 3, rmse: 3, mape: 3, dirAccuracy: 80, computedAt: new Date() },
    ]);

    const result = await dbMarketProvider.getForecastsData();

    expect(result.modelPerformance).toEqual([
      { model: "Linear Regression", avgMAE: "2.00", avgRMSE: "2.00", avgMAPE: "2.00%", avgAccuracy: "70%" },
      { model: "Naive Baseline", avgMAE: "3.00", avgRMSE: "3.00", avgMAPE: "3.00%", avgAccuracy: "50%" },
    ]);
  });
});

describe("staticMarketProvider.getForecastsData", () => {
  it("falls back to the bundled demo dataset when no forecasts snapshot exists yet", async () => {
    vi.mocked(getAllForecastsFromSnapshot).mockResolvedValue([]);

    const result = await staticMarketProvider.getForecastsData();

    expect(result.forecasts).toBe(allForecasts);
    expect(result.modelPerformance).toBe(modelPerformance);
    expect(result.summary).toBe(forecastSummary);
  });

  it("computes real trend and model performance from a published snapshot instead of a hardcoded Mixed Signal", async () => {
    vi.mocked(getAllForecastsFromSnapshot).mockResolvedValue([
      {
        symbol: "BDO",
        model: "linear",
        horizonDays: 7,
        generatedAt: "2026-07-30T00:00:00.000Z",
        points: [
          { date: "Jul 30", price: 100, forecast: null },
          { date: "Aug 6", price: null, forecast: 112 },
        ],
      },
      {
        symbol: "MBT",
        model: "linear",
        horizonDays: 7,
        generatedAt: "2026-07-30T00:00:00.000Z",
        points: [
          { date: "Jul 30", price: 50, forecast: null },
          { date: "Aug 6", price: null, forecast: 44 },
        ],
      },
      // Wrong model for the horizon this page reads — must be filtered out.
      {
        symbol: "BDO",
        model: "naive",
        horizonDays: 7,
        generatedAt: "2026-07-30T00:00:00.000Z",
        points: [],
      },
    ]);
    vi.mocked(getQuotesSnapshot).mockReturnValue(
      new Map([
        ["BDO", quote(100)],
        ["MBT", quote(50)],
      ]),
    );
    vi.mocked(getQuotesSnapshotAsOf).mockReturnValue(new Date("2026-07-30T08:00:00.000Z"));
    vi.mocked(getAllMetricsFromSnapshot).mockResolvedValue([
      {
        symbol: "BDO",
        model: "linear",
        horizonDays: 7,
        mae: 1,
        rmse: 1,
        mape: 1,
        dirAccuracy: 65,
        computedAt: "2026-07-30T00:00:00.000Z",
      },
      {
        symbol: "BDO",
        model: "naive",
        horizonDays: 7,
        mae: 3,
        rmse: 3,
        mape: 3,
        dirAccuracy: 45,
        computedAt: "2026-07-30T00:00:00.000Z",
      },
      {
        symbol: "MBT",
        model: "linear",
        horizonDays: 7,
        mae: 2,
        rmse: 2,
        mape: 2,
        dirAccuracy: 55,
        computedAt: "2026-07-30T00:00:00.000Z",
      },
    ]);

    const result = await staticMarketProvider.getForecastsData();

    expect(result.forecasts).toHaveLength(2);

    const bdo = result.forecasts.find((f) => f.ticker === "BDO.PS");
    expect(bdo).toMatchObject({
      currentPrice: "100",
      forecast7d: "112",
      trend: "Projected Upward",
      accuracy: "65.0%",
      expectedChange: "+12.0%",
    });

    const mbt = result.forecasts.find((f) => f.ticker === "MBT.PS");
    expect(mbt).toMatchObject({
      currentPrice: "50",
      forecast7d: "44",
      trend: "Projected Downward",
      accuracy: "55.0%",
      expectedChange: "-12.0%",
    });

    expect(result.modelPerformance).toEqual([
      { model: "Linear Regression", avgMAE: "1.50", avgRMSE: "1.50", avgMAPE: "1.50%", avgAccuracy: "60%" },
      { model: "Naive Baseline", avgMAE: "3.00", avgRMSE: "3.00", avgMAPE: "3.00%", avgAccuracy: "45%" },
    ]);

    expect(result.summary.totalToday).toBe(2);
    expect(result.summary.upwardCount).toBe(1);
    expect(result.summary.upwardPercent).toBe("50%");
    expect(result.summary.averageAccuracy).toBe("60%");
    expect(result.summary.lastUpdated).not.toBe(forecastSummary.lastUpdated);
  });
});
