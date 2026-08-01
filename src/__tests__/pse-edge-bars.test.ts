import { describe, expect, it, vi, afterEach } from "vitest";

import { fetchPseEdgeHistoricalBars } from "../../scripts/market/pse-edge-bars";

describe("fetchPseEdgeHistoricalBars", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses chartData into daily bars", async () => {
    const recent = new Date();
    recent.setUTCDate(recent.getUTCDate() - 5);
    const chartDate = recent.toISOString();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          chartData: [
            {
              OPEN: 100,
              HIGH: 105,
              LOW: 99,
              CLOSE: 104,
              CHART_DATE: chartDate,
            },
          ],
        }),
      ),
    );

    const bars = await fetchPseEdgeHistoricalBars(
      "BDO",
      "260",
      "468",
      30,
      0,
    );
    expect(bars.length).toBe(1);
    expect(bars[0]?.symbol).toBe("BDO");
    expect(bars[0]?.close).toBe(104);
    expect(bars[0]?.volume).toBeNull();
  });

  // Regression coverage for the Technical tab's Volume chart always being
  // empty: this endpoint has no per-day share volume field, but VALUE
  // (peso value traded) is present and VALUE / CLOSE closely approximates
  // it — verified against PSE EDGE's own real VOLUME for BDO and MG live,
  // within ~0.5%.
  it("approximates volume from VALUE / CLOSE when VALUE is present", async () => {
    const recent = new Date();
    recent.setUTCDate(recent.getUTCDate() - 5);
    const chartDate = recent.toISOString();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          chartData: [
            {
              OPEN: 126.2,
              HIGH: 127,
              LOW: 124.5,
              CLOSE: 124.5,
              VALUE: 483093587,
              CHART_DATE: chartDate,
            },
          ],
        }),
      ),
    );

    const bars = await fetchPseEdgeHistoricalBars("BDO", "260", "468", 30, 0);
    expect(bars[0]?.volume).toBe(Math.round(483093587 / 124.5));
  });
});
