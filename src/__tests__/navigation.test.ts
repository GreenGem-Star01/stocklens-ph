import { describe, expect, it } from "vitest";

import { isNavItemActive } from "@/lib/navigation";

describe("isNavItemActive", () => {
  it("highlights dashboard for stock routes", () => {
    expect(isNavItemActive("/stock/bdo", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("highlights other nav items by prefix", () => {
    expect(isNavItemActive("/forecasts", "/forecasts")).toBe(true);
    expect(isNavItemActive("/watchlist", "/dashboard")).toBe(false);
  });
});
