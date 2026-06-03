import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parsePseiIndexFromHtml } from "../../scripts/market/pse-edge-index";

describe("pse-edge-index", () => {
  it("parses PSEi row from EDGE index summary HTML", () => {
    const html = readFileSync(
      join(process.cwd(), "src/__tests__/fixtures/pse-index-summary-snippet.html"),
      "utf8",
    );
    const quote = parsePseiIndexFromHtml(html);
    expect(quote).not.toBeNull();
    expect(quote!.symbol).toBe("PSEI");
    expect(quote!.lastClose).toBeCloseTo(5976.77, 2);
    expect(quote!.changeAbs).toBeCloseTo(38.26, 2);
    expect(quote!.changePct).toBeCloseTo(0.64, 2);
  });
});
