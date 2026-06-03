import { describe, expect, it } from "vitest";

import {
  barsToPseiChart,
  buildPseiChartFromMarket,
  mergePseiQuoteIntoBars,
  PSEI_CHART_TRADING_DAYS,
  pseiYAxisDomain,
} from "@/lib/market/psei-chart";
import type { MarketBar, MarketQuote } from "@/lib/market/types";

function bar(date: string, close: number): MarketBar {
  return {
    symbol: "PSEI",
    tradeDate: date,
    open: close,
    high: close,
    low: close,
    close,
    volume: null,
  };
}

describe("barsToPseiChart", () => {
  it("maps daily bars to chart points", () => {
    const points = barsToPseiChart([bar("2026-05-15", 6234)]);
    expect(points).toHaveLength(1);
    expect(points[0]!.value).toBe(6234);
    expect(points[0]!.date).toMatch(/May/);
  });

  it("keeps only the last eight trading days", () => {
    const bars = Array.from({ length: 12 }, (_, i) =>
      bar(`2026-05-${String(i + 1).padStart(2, "0")}`, 5800 + i),
    );
    const points = barsToPseiChart(bars);
    expect(points).toHaveLength(PSEI_CHART_TRADING_DAYS);
    expect(points[0]!.value).toBe(5804);
    expect(points.at(-1)!.value).toBe(5811);
  });
});

describe("mergePseiQuoteIntoBars", () => {
  const quote: MarketQuote = {
    symbol: "PSEI",
    lastClose: 5893.4,
    changePct: 0.06,
    changeAbs: 3.4,
    volume: null,
    asOf: new Date("2026-05-20T15:36:58.851Z"),
    source: "pse_edge_index_summary",
  };

  it("appends a point when quote is newer than the last bar", () => {
    const bars = [
      bar("2026-05-14", 5880),
      bar("2026-05-15", 5890),
      bar("2026-05-16", 5890),
    ];
    const merged = mergePseiQuoteIntoBars(bars, quote);
    expect(merged).toHaveLength(4);
    expect(merged.at(-1)!.tradeDate).toBe("2026-05-20");
    expect(merged.at(-1)!.close).toBe(5893.4);
  });

  it("chart last label matches quote day after merge", () => {
    const points = buildPseiChartFromMarket(
      [bar("2026-05-16", 5890)],
      quote,
    );
    expect(points.at(-1)!.value).toBe(5893.4);
    expect(points.at(-1)!.date).toMatch(/May\s+20/);
  });
});

describe("pseiYAxisDomain", () => {
  it("pads around live PSEi levels (~5.9k)", () => {
    const [lo, hi] = pseiYAxisDomain([5850, 5860, 5870, 5880, 5890, 5893]);
    expect(lo).toBeLessThan(5850);
    expect(hi).toBeGreaterThan(5893);
    expect(lo).toBeLessThan(6400);
    expect(hi).toBeLessThan(6500);
  });

  it("handles a flat series", () => {
    const [lo, hi] = pseiYAxisDomain([5893, 5893]);
    expect(lo).toBeLessThan(5893);
    expect(hi).toBeGreaterThan(5893);
  });
});
