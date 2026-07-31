import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for a bug where /api/watchlist/backtest unconditionally
// returned { available: false, reason: "static" } under
// MARKET_DATA_SOURCE=static, even though the published forecasts snapshot
// already carries the same per-symbol walk-forward metrics the DB path
// computes live from bars. These mock the snapshot repository so the real
// aggregation logic runs against deterministic fixtures.

vi.mock("@/lib/market/forecasts-snapshot", () => ({
  getAllMetricsFromSnapshot: vi.fn(),
}));

import { getAllMetricsFromSnapshot } from "@/lib/market/forecasts-snapshot";
import { GET } from "@/app/api/watchlist/backtest/route";

function metricRow(overrides: Partial<Awaited<ReturnType<typeof getAllMetricsFromSnapshot>>[number]>) {
  return {
    symbol: "BDO",
    model: "linear",
    horizonDays: 7,
    mae: 1,
    rmse: 1,
    mape: 1,
    dirAccuracy: 60,
    computedAt: "2026-07-30T00:00:00.000Z",
    ...overrides,
  };
}

function request(query: string): Request {
  return new Request(`http://localhost/api/watchlist/backtest?${query}`);
}

beforeEach(() => {
  vi.stubEnv("MARKET_DATA_SOURCE", "static");
  vi.resetAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/watchlist/backtest (static mode)", () => {
  it("reports unavailable when no forecasts snapshot has been published for this horizon", async () => {
    vi.mocked(getAllMetricsFromSnapshot).mockResolvedValue([]);

    const res = await GET(request("tickers=BDO.PS&horizon=7d"));
    const body = await res.json();

    expect(body).toEqual({ available: false, reason: "static" });
  });

  it("computes portfolio model-fit metrics from the snapshot instead of live bar history", async () => {
    vi.mocked(getAllMetricsFromSnapshot).mockResolvedValue([
      metricRow({ symbol: "BDO", model: "linear", mae: 1, rmse: 1, mape: 1, dirAccuracy: 60 }),
      metricRow({ symbol: "BDO", model: "naive", mae: 3, rmse: 3, mape: 5, dirAccuracy: 40 }),
      metricRow({ symbol: "MBT", model: "linear", mae: 3, rmse: 3, mape: 3, dirAccuracy: 80 }),
      metricRow({ symbol: "MBT", model: "naive", mae: 5, rmse: 5, mape: 7, dirAccuracy: 60 }),
      // Wrong horizon — must be excluded from the 7d aggregation below.
      metricRow({ symbol: "BDO", model: "linear", horizonDays: 30, mae: 999 }),
    ]);

    const res = await GET(request("tickers=BDO.PS,MBT.PS&horizon=7d"));
    const body = await res.json();

    expect(body.available).toBe(true);
    expect(body.horizonDays).toBe(7);
    expect(body.tickersUsed).toEqual(["BDO.PS", "MBT.PS"]);
    expect(body.tickersSkipped).toEqual([]);

    const linear = body.models.find((m: { model: string }) => m.model === "linear");
    const naive = body.models.find((m: { model: string }) => m.model === "naive");
    expect(linear).toMatchObject({ avgMae: 2, avgRmse: 2, avgMape: 2, avgDirAccuracy: 70, tickerCount: 2 });
    expect(naive).toMatchObject({ avgMae: 4, avgRmse: 4, avgMape: 6, avgDirAccuracy: 50, tickerCount: 2 });
    // linear has the lower avgMape, so it should be selected as best-fit.
    expect(body.bestModel).toBe("linear");
  });

  it("skips a requested ticker with no snapshot metrics instead of failing the whole request", async () => {
    vi.mocked(getAllMetricsFromSnapshot).mockResolvedValue([
      metricRow({ symbol: "BDO", model: "linear" }),
    ]);

    const res = await GET(request("tickers=BDO.PS,SM.PS&horizon=7d"));
    const body = await res.json();

    expect(body.available).toBe(true);
    expect(body.tickersUsed).toEqual(["BDO.PS"]);
    expect(body.tickersSkipped).toEqual([
      { ticker: "SM.PS", reason: "no forecast history available" },
    ]);
  });
});
