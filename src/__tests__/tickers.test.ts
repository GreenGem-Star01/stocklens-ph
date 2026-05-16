import { describe, expect, it } from "vitest";

import {
  BLUE_CHIP_TICKERS,
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

  it("includes 30 blue chips plus PSEi index", () => {
    expect(BLUE_CHIP_TICKERS).toHaveLength(30);
    expect(SUPPORTED_TICKERS).toHaveLength(31);
    expect(resolveTickerFromInput("SM.PS")?.ticker).toBe("SM.PS");
    expect(resolveTickerFromInput("mbt")?.ticker).toBe("MBT.PS");
  });
});
