import { describe, expect, it } from "vitest";

import { mergeAnalysisWithMarketData } from "@/lib/market/merge-analysis";
import type { MarketBar, MarketQuote } from "@/lib/market/types";

describe("mergeAnalysisWithMarketData", () => {
  it("overrides metrics when a live quote is provided", () => {
    const quote: MarketQuote = {
      symbol: "BDO",
      lastClose: 150.25,
      changePct: 1.2,
      changeAbs: 1.78,
      volume: 1_200_000,
      asOf: new Date("2026-05-16T10:00:00Z"),
      source: "test",
    };

    const merged = mergeAnalysisWithMarketData("BDO.PS", quote, []);
    expect(merged).not.toBeNull();
    expect(merged!.metrics.lastClose).toContain("150");
    expect(merged!.metrics.dailyChange).toContain("1.2");
  });

  it("keeps official PSE sector after merge", () => {
    const merged = mergeAnalysisWithMarketData("SM.PS", null, []);
    expect(merged?.info.sector).toBe("Holding Firms");
    expect(merged?.info.subsector).toBeTruthy();
  });

  it("builds chart history from daily bars", () => {
    const bars: MarketBar[] = [
      {
        symbol: "BDO",
        tradeDate: "2026-05-14",
        open: 148,
        high: 149,
        low: 147,
        close: 148.5,
        volume: 1000,
      },
      {
        symbol: "BDO",
        tradeDate: "2026-05-15",
        open: 149,
        high: 151,
        low: 148,
        close: 150,
        volume: 1100,
      },
    ];

    const merged = mergeAnalysisWithMarketData("BDO.PS", undefined, bars);
    expect(merged).not.toBeNull();
    const historical = merged!.chartData.filter((p) => p.forecast == null);
    expect(historical.length).toBe(2);
    expect(historical.some((p) => p.price === 150)).toBe(true);
    expect(merged!.chartDomain[0]).toBeLessThan(150);
    expect(merged!.chartDomain[1]).toBeGreaterThan(140);
    const forecast = merged!.chartData.filter((p) => p.forecast != null);
    expect(forecast.length).toBeGreaterThan(0);
    expect(forecast[0]?.date).toBe("May 16");
  });
});
