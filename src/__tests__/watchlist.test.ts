import { describe, expect, it } from "vitest";

import { WATCHLIST_MAX_STOCKS } from "@/lib/constants/watchlist";
import {
  formatWatchlistCount,
  watchlistAddDescription,
} from "@/lib/watchlist";

describe("watchlist helpers", () => {
  it("formats count against max", () => {
    expect(formatWatchlistCount(4)).toBe(`4 of ${WATCHLIST_MAX_STOCKS} stocks`);
  });

  it("describes limit rejection", () => {
    expect(
      watchlistAddDescription({ ok: false, reason: "limit" }, "TEL.PS"),
    ).toContain(String(WATCHLIST_MAX_STOCKS));
  });
});
