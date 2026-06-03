import { describe, expect, it } from "vitest";

import {
  formatStockChartTick,
  stockChartYAxisDomain,
} from "@/lib/market/chart-domain";

describe("stockChartYAxisDomain", () => {
  it("pads BDO-scale prices without micro-tick span", () => {
    const [lo, hi] = stockChartYAxisDomain([136, 137, 138, 139, 140, 141, 142]);
    expect(lo).toBeLessThan(136);
    expect(hi).toBeGreaterThan(142);
    expect(hi - lo).toBeGreaterThan(1);
  });

  it("handles string values from serialization", () => {
    const [lo, hi] = stockChartYAxisDomain(["116.5", "117", "118.2"]);
    expect(Number.isFinite(lo)).toBe(true);
    expect(Number.isFinite(hi)).toBe(true);
    expect(lo).toBeLessThan(116.5);
  });
});

describe("formatStockChartTick", () => {
  it("formats equity ticks in PHP style", () => {
    expect(formatStockChartTick(138.5)).toMatch(/138/);
    expect(formatStockChartTick(0.000002)).not.toContain("0000002");
  });
});
