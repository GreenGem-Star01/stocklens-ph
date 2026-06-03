import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseCompaniesFromHtml,
  parseTotalFromHtml,
} from "../../scripts/parse-pse-edge-html";

describe("parse PSE EDGE HTML", () => {
  const sample = readFileSync(
    join(process.cwd(), "scripts/fixtures/pse-edge-directory-sample.html"),
    "utf8",
  );

  it("parses total count", () => {
    expect(parseTotalFromHtml(sample)).toBe(2);
  });

  it("parses company rows with sector and subsector", () => {
    const rows = parseCompaniesFromHtml(sample, new Set(["BDO.PS"]));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.symbol).toBe("AAA");
    expect(rows[0]?.sector).toBe("Holding Firms");
    expect(rows[1]?.subsector).toBe("Media");
  });
});
