import { describe, expect, it } from "vitest";

import {
  buildStocksBrowseUrl,
  getAllSectorSlugs,
  sectorToSlug,
  slugToSector,
} from "@/lib/pse/sector-slug";

describe("sector-slug", () => {
  it("round-trips official sector names", () => {
    const slug = sectorToSlug("Holding Firms");
    expect(slug).toBe("holding-firms");
    expect(slugToSector(slug)).toBe("Holding Firms");
  });

  it("builds canonical browse URLs", () => {
    expect(buildStocksBrowseUrl({ sector: "Financials" })).toBe(
      "/stocks/sector/financials",
    );
    expect(
      buildStocksBrowseUrl({
        sector: "Financials",
        subsector: "Banks",
        query: "bdo",
      }),
    ).toContain("/stocks/sector/financials?");
    expect(
      buildStocksBrowseUrl({
        sector: "Financials",
        subsector: "Banks",
        query: "bdo",
      }),
    ).toMatch(/subsector=Banks/);
    expect(
      buildStocksBrowseUrl({
        sector: "Financials",
        subsector: "Banks",
        query: "bdo",
      }),
    ).toMatch(/q=bdo/);
    expect(buildStocksBrowseUrl({ sector: "all", query: "sm" })).toBe(
      "/stocks?q=sm",
    );
  });

  it("generates slugs for all PSE sectors", () => {
    const slugs = getAllSectorSlugs();
    expect(slugs.length).toBeGreaterThan(5);
    for (const { sector, slug } of slugs) {
      expect(slugToSector(slug)).toBe(sector);
    }
  });
});
