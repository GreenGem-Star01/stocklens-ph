import { describe, expect, it } from "vitest";

import {
  entriesToQuotesMap,
  quotesMapToEntries,
  toQuotesMap,
} from "@/lib/market/quotes-map";
import type { MarketQuote } from "@/lib/market/types";

describe("quotes map cache helpers", () => {
  const sample: MarketQuote = {
    symbol: "BDO",
    lastClose: 115,
    changePct: 0,
    changeAbs: 0,
    volume: 1,
    asOf: new Date("2026-05-20T12:00:00Z"),
    source: "test",
  };

  it("round-trips through cache entries", () => {
    const map = new Map([["BDO", sample]]);
    const back = entriesToQuotesMap(quotesMapToEntries(map));
    expect(back.get("BDO")?.lastClose).toBe(115);
    expect(back.get("BDO")?.asOf).toBeInstanceOf(Date);
  });

  it("normalizes plain objects from unstable_cache", () => {
    const obj = { BDO: sample };
    const map = toQuotesMap(obj);
    expect(map.get("BDO")?.symbol).toBe("BDO");
  });
});
