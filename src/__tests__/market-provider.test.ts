import { describe, expect, it } from "vitest";

import {
  getMarketProvider,
  getStockAnalysisData,
  resetMarketProvider,
} from "@/lib/api/market-provider";

describe("market provider (static)", () => {
  it("returns seeded analysis for blue-chip tickers", async () => {
    resetMarketProvider();
    const analysis = await getStockAnalysisData("BDO.PS");
    expect(analysis?.info.ticker).toBe("BDO.PS");
    expect(analysis?.metrics.lastClose).toBeTruthy();
  });

  it("uses static provider when MARKET_DATA_SOURCE is not db", () => {
    resetMarketProvider();
    const provider = getMarketProvider();
    expect(provider).toBeDefined();
  });
});
