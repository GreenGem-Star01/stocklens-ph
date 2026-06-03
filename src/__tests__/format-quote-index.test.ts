import { describe, expect, it } from "vitest";

import { formatPriceAmount } from "@/lib/market/format-quote";

describe("formatPriceAmount (index)", () => {
  it("shows two decimal places for PSEi levels", () => {
    expect(formatPriceAmount(5893.4, true)).toBe("5,893.40");
  });
});
