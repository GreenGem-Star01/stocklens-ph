import { describe, expect, it } from "vitest";

import { parseSymbolsFilter } from "../../scripts/ingest-market-quotes";

describe("parseSymbolsFilter", () => {
  it("returns null when --symbols isn't passed (no filter, full universe)", () => {
    expect(parseSymbolsFilter(["node", "script.js", "--respect-market-hours"])).toBeNull();
  });

  it("parses a comma-separated list into an uppercase Set", () => {
    const filter = parseSymbolsFilter(["--symbols=PSEI,BDO,JFC,ALI,TEL,SMPH"]);
    expect(filter).toEqual(
      new Set(["PSEI", "BDO", "JFC", "ALI", "TEL", "SMPH"]),
    );
  });

  it("trims whitespace and normalizes case", () => {
    const filter = parseSymbolsFilter(["--symbols= bdo , Jfc ,ALI"]);
    expect(filter).toEqual(new Set(["BDO", "JFC", "ALI"]));
  });

  it("drops empty entries from stray commas", () => {
    const filter = parseSymbolsFilter(["--symbols=BDO,,JFC,"]);
    expect(filter).toEqual(new Set(["BDO", "JFC"]));
  });
});
