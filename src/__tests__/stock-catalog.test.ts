import { describe, expect, it } from "vitest";

import { BLUE_CHIP_SEEDS } from "@/lib/data/stock-seeds";
import {
  getAllStockAnalyses,
  getStockAnalysisStatic,
} from "@/lib/data/stocks";

describe("stock catalog", () => {
  it("builds analysis for every blue chip seed", () => {
    expect(getAllStockAnalyses()).toHaveLength(BLUE_CHIP_SEEDS.length + 1);
    for (const seed of BLUE_CHIP_SEEDS) {
      const analysis = getStockAnalysisStatic(seed.ticker);
      expect(analysis?.info.ticker).toBe(seed.ticker);
      expect(analysis?.chartData.length).toBeGreaterThan(10);
    }
  });

  it("uses official PSE sectors for analyzed tickers", () => {
    expect(getStockAnalysisStatic("SM.PS")?.info.sector).toBe("Holding Firms");
    expect(getStockAnalysisStatic("MBT.PS")?.info.sector).toBe("Financials");
    expect(getStockAnalysisStatic("FGEN.PS")?.info.sector).toBe("Industrial");
  });
});
