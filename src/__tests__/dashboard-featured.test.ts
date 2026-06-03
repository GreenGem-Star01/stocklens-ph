import { describe, expect, it } from "vitest";

import { featuredStocks } from "@/lib/data/dashboard-featured";

describe("dashboard featured stocks", () => {
  it("uses official PSE sectors from universe", () => {
    const jfc = featuredStocks.find((s) => s.ticker === "JFC.PS");
    const ali = featuredStocks.find((s) => s.ticker === "ALI.PS");
    expect(jfc?.sector).toBe("Industrial");
    expect(ali?.sector).toBe("Property");
  });
});
