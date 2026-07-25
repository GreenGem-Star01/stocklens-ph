import { describe, expect, it } from "vitest";

import { computeIndicators } from "@/lib/market/indicators";
import type { MarketBar } from "@/lib/market/types";

function bar(date: string, close: number, volume = 1000): MarketBar {
  return {
    symbol: "TEST",
    tradeDate: date,
    open: close,
    high: close,
    low: close,
    close,
    volume,
  };
}

describe("computeIndicators", () => {
  it("computes SMA20 after 20 bars", () => {
    const bars = Array.from({ length: 25 }, (_, i) =>
      bar(`2026-01-${String(i + 1).padStart(2, "0")}`, 100 + i),
    );
    const points = computeIndicators(bars);
    expect(points[19]?.sma20).toBeCloseTo(109.5, 1);
    expect(points[18]?.sma20).toBeNull();
  });

  it("computes RSI in 0-100 range", () => {
    const bars = Array.from({ length: 30 }, (_, i) =>
      bar(`2026-02-${String(i + 1).padStart(2, "0")}`, 50 + (i % 3)),
    );
    const points = computeIndicators(bars);
    const last = points.at(-1);
    expect(last?.rsi14).not.toBeNull();
    expect(last!.rsi14!).toBeGreaterThanOrEqual(0);
    expect(last!.rsi14!).toBeLessThanOrEqual(100);
  });

  it("computes MACD after slow period", () => {
    const bars = Array.from({ length: 40 }, (_, i) =>
      bar(`2026-03-${String(i + 1).padStart(2, "0")}`, 100 + Math.sin(i / 3) * 5),
    );
    const points = computeIndicators(bars);
    const last = points.at(-1);
    expect(last?.macd).not.toBeNull();
    expect(last?.macdSignal).not.toBeNull();
    expect(last?.macdHist).not.toBeNull();
  });
});
