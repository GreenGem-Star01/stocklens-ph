import { describe, expect, it } from "vitest";

import {
  getListedEquities,
  getOfficialListingLabels,
  getPseUniverse,
} from "@/lib/pse/universe";

describe("PSE official universe", () => {
  it("loads committed universe with official sectors", () => {
    const { meta, companies } = getPseUniverse();
    expect(meta.source).toContain("PSE EDGE");
    expect(companies.length).toBeGreaterThanOrEqual(200);
    expect(getListedEquities().length).toBe(meta.totalListed);
  });

  it("includes official sector and subsector on entries", () => {
    const bdo = getListedEquities().find((c) => c.symbol === "BDO");
    expect(bdo?.sector).toBeTruthy();
    expect(bdo?.subsector).toBeTruthy();
  });

  it("getOfficialListingLabels returns universe taxonomy", () => {
    const sm = getOfficialListingLabels("SM");
    expect(sm?.sector).toBe("Holding Firms");
    expect(sm?.subsector).toBeTruthy();
  });
});
