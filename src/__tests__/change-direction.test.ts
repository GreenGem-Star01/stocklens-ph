import { describe, expect, it } from "vitest";

import {
  directionFromChangePct,
  directionFromChangeString,
  formatChangePct,
} from "@/lib/market/change-direction";

describe("change direction", () => {
  it("treats zero as flat without a plus sign", () => {
    expect(directionFromChangePct(0)).toBe("flat");
    expect(formatChangePct(0)).toBe("0.0%");
  });

  it("formats up and down with correct signs", () => {
    expect(formatChangePct(1.2)).toBe("+1.2%");
    expect(formatChangePct(-2.5)).toBe("-2.5%");
    expect(directionFromChangePct(1.2)).toBe("up");
    expect(directionFromChangePct(-2.5)).toBe("down");
  });

  it("parses legacy +0.0% strings as flat", () => {
    expect(directionFromChangeString("+0.0%")).toBe("flat");
    expect(directionFromChangeString("0.0%")).toBe("flat");
  });
});
