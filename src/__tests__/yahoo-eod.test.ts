import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchYahooDailyBars,
  parseDailyBarsFromChart,
  yahooRangeParam,
} from "../../scripts/market/yahoo-eod";

describe("yahooRangeParam", () => {
  it("uses max for long history windows", () => {
    expect(yahooRangeParam(400)).toBe("max");
    expect(yahooRangeParam(90)).toBe("3mo");
    expect(yahooRangeParam(200)).toBe("1y");
  });
});

describe("parseDailyBarsFromChart", () => {
  it("returns empty array when quote series is missing", () => {
    const bars = parseDailyBarsFromChart({ chart: { result: [{}] } }, "BDO.PS", 30);
    expect(bars).toEqual([]);
  });

  it("parses daily OHLCV and filters by rangeDays", () => {
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;
    const body = {
      chart: {
        result: [
          {
            timestamp: [now - day * 10, now - day * 5, now - day],
            indicators: {
              quote: [
                {
                  open: [100, 101, 102],
                  high: [105, 106, 107],
                  low: [99, 100, 101],
                  close: [104, 105, 106],
                  volume: [1000, 1100, 1200],
                },
              ],
            },
          },
        ],
      },
    };

    const bars = parseDailyBarsFromChart(body, "BDO.PS", 30);
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0]?.symbol).toBe("BDO");
    expect(bars.at(-1)?.close).toBe(106);
  });

  it("throws when chart.error is set", () => {
    expect(() =>
      parseDailyBarsFromChart(
        { chart: { error: { description: "Invalid symbol" } } },
        "BAD.PS",
        30,
      ),
    ).toThrow("Invalid symbol");
  });
});

describe("fetchYahooDailyBars", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries on 429 then returns bars", async () => {
    const now = Math.floor(Date.now() / 1000);
    const okBody = {
      chart: {
        result: [
          {
            timestamp: [now - 86400, now],
            indicators: {
              quote: [
                {
                  open: [50, 51],
                  high: [52, 53],
                  low: [49, 50],
                  close: [51, 52],
                  volume: [100, 200],
                },
              ],
            },
          },
        ],
      },
    };

    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls++;
        if (calls === 1) {
          return new Response(null, { status: 429 });
        }
        return new Response(JSON.stringify(okBody), { status: 200 });
      }),
    );

    const bars = await fetchYahooDailyBars("BDO", 30, 0, {
      maxAttempts: 2,
    });
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0]?.symbol).toBe("BDO");
    expect(calls).toBeGreaterThan(1);
  });

  it("returns empty when all attempts fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404 })),
    );

    const bars = await fetchYahooDailyBars("ZZZ", 30, 0, { maxAttempts: 1 });
    expect(bars).toEqual([]);
  });
});
