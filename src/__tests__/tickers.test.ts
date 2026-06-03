import { describe, expect, it } from "vitest";

import {
  LISTED_EQUITY_TICKERS,
  resolveTickerFromInput,
  SUPPORTED_TICKERS,
  TICKER_PATHS,
} from "@/lib/constants/tickers";
import { pathToTicker, tickerToPath } from "@/lib/forecast";

describe("ticker registry", () => {
  it("resolves symbol and path inputs", () => {
    expect(resolveTickerFromInput("BDO.PS")?.ticker).toBe("BDO.PS");
    expect(resolveTickerFromInput("bdo")?.ticker).toBe("BDO.PS");
    expect(resolveTickerFromInput("unknown")).toBeNull();
  });

  it("maps path to ticker and back", () => {
    expect(pathToTicker("jfc")).toBe("JFC.PS");
    expect(pathToTicker("JFC.PS")).toBe("JFC.PS");
    expect(pathToTicker("bdo.ps")).toBe("BDO.PS");
    expect(pathToTicker("FAKE.PS")).toBeNull();
    expect(pathToTicker("invalid")).toBeNull();
    expect(tickerToPath("JFC.PS")).toBe("jfc");
  });

  it("knows all supported paths", () => {
    expect(TICKER_PATHS.has("psei")).toBe(true);
    expect(TICKER_PATHS.has("sm")).toBe(true);
    expect(TICKER_PATHS.has("mbt")).toBe(true);
    expect(TICKER_PATHS.has("invalid")).toBe(false);
  });

  it("includes full PSE equity list plus index", () => {
    expect(LISTED_EQUITY_TICKERS.length).toBeGreaterThanOrEqual(200);
    expect(SUPPORTED_TICKERS.length).toBeGreaterThan(LISTED_EQUITY_TICKERS.length);
    expect(resolveTickerFromInput("AAA")?.ticker).toBe("AAA.PS");
  });
});
