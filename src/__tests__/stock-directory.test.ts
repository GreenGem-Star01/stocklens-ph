import { describe, expect, it } from "vitest";

import { BLUE_CHIP_SEEDS } from "@/lib/data/stock-seeds";
import {
  filterStockDirectory,
  getEquityDirectoryCount,
  getStockDirectoryEntries,
} from "@/lib/data/stock-directory";

describe("stock directory", () => {
  it("includes 30 equities plus PSEi index", () => {
    const entries = getStockDirectoryEntries();
    expect(getEquityDirectoryCount()).toBe(30);
    expect(entries).toHaveLength(BLUE_CHIP_SEEDS.length + 1);
    expect(entries.some((e) => e.ticker === "PSEI.PS")).toBe(true);
  });

  it("filters by query and sector", () => {
    const entries = getStockDirectoryEntries();
    const byQuery = filterStockDirectory(entries, "metrobank", "all");
    expect(byQuery.some((e) => e.ticker === "MBT.PS")).toBe(true);

    const bySector = filterStockDirectory(entries, "", "Financials");
    expect(bySector.every((e) => e.sector === "Financials")).toBe(true);
    expect(bySector.length).toBeGreaterThan(3);
  });
});
