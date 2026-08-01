import { describe, expect, it } from "vitest";

import { buildMarketAnalysis } from "@/lib/data/build-market-analysis";
import type { MarketBar, MarketQuote } from "@/lib/market/types";

// Regression coverage for a bug where aiInsight/marketContext.sectorNote
// stayed frozen at whatever the static demo seed said (e.g. a hardcoded
// price and directional accuracy), even once the rest of the page (Last
// Close stat card, Models tab) had moved on to live-computed values —
// producing an "AI Market Insight" that visibly contradicted the numbers
// shown two inches above it on the same page.

function syntheticBars(n: number, startPrice: number, trendPerDay: number): MarketBar[] {
  const start = new Date("2026-01-01T00:00:00Z");
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const close = startPrice + i * trendPerDay;
    return {
      symbol: "BDO",
      tradeDate: d.toISOString().slice(0, 10),
      open: close,
      high: close,
      low: close,
      close,
      volume: 1000,
    };
  });
}

function quote(lastClose: number): MarketQuote {
  return {
    symbol: "BDO",
    lastClose,
    changePct: 1.2,
    changeAbs: 1.5,
    volume: 1_000_000,
    asOf: new Date("2026-04-15T08:00:00Z"),
    source: "test",
  };
}

describe("buildMarketAnalysis aiInsight/marketContext", () => {
  it("regenerates aiInsight and marketContext from live metrics instead of the frozen demo seed", async () => {
    const bars = syntheticBars(90, 100, 0.3);
    const lastClose = bars.at(-1)!.close;

    const analysis = await buildMarketAnalysis("BDO.PS", quote(lastClose), bars);

    expect(analysis).not.toBeNull();
    // The insight text must reference the same live price shown in the
    // metrics card, not a stale seed value baked in at a different price.
    expect(analysis!.aiInsight.summary).toContain(analysis!.metrics.lastClose);
    expect(analysis!.aiInsight.caution).toContain(analysis!.performance.directionalAccuracy);
  });

  it("leaves aiInsight/marketContext at the demo seed's own (internally consistent) text when there's no live quote", async () => {
    const analysis = await buildMarketAnalysis("BDO.PS", undefined, []);

    expect(analysis).not.toBeNull();
    // Without a quote there's nothing live to regenerate from — the seed's
    // own price/accuracy stay paired together rather than being partially
    // overwritten into a new inconsistency.
    expect(analysis!.aiInsight.summary).toContain(analysis!.metrics.lastClose);
  });
});
