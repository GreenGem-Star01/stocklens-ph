import { describe, expect, it, vi, afterEach } from "vitest";

import { fetchPseEdgeHistoricalBars } from "../../scripts/market/pse-edge-bars";

describe("fetchPseEdgeHistoricalBars", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses chartData into daily bars", async () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5);
    const chartDate = recent.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

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
  });
});
