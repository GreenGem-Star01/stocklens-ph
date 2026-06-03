import { describe, expect, it } from "vitest";

import {
  filterStockDirectory,
  getEquityDirectoryCount,
  getStockDirectoryEntries,
} from "@/lib/data/stock-directory";

describe("stock directory", () => {
  it("includes full PSE listings", () => {
    const entries = getStockDirectoryEntries();
    expect(getEquityDirectoryCount()).toBeGreaterThanOrEqual(200);
    expect(entries.length).toBeGreaterThan(getEquityDirectoryCount());
  });

  it("filters by sector and subsector", () => {
    const entries = getStockDirectoryEntries();
    const financials = filterStockDirectory(entries, "", "Financials", "all");
    expect(financials.length).toBeGreaterThan(5);
    expect(financials.every((e) => e.sector === "Financials")).toBe(true);

    const banks = filterStockDirectory(
      entries,
      "",
      "Financials",
      "Banks",
    );
    if (banks.length > 0) {
      expect(banks.every((e) => e.subsector === "Banks")).toBe(true);
    }
  });
});
