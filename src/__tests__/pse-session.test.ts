import { describe, expect, it } from "vitest";

import { getMarketSession } from "@/lib/market/pse-session";

/** Fixed instant in Manila: Wed 2026-05-20 10:00 */
const WED_MORNING_OPEN = new Date("2026-05-20T02:00:00.000Z");
/** Wed 2026-05-20 16:00 Manila */
const WED_AFTER_CLOSE = new Date("2026-05-20T08:00:00.000Z");
/** Sat 2026-05-23 10:00 Manila */
const SAT_MORNING = new Date("2026-05-23T02:00:00.000Z");

describe("getMarketSession", () => {
  it("reports open during regular session", () => {
    const session = getMarketSession(WED_MORNING_OPEN);
    expect(session.status).toBe("open");
    expect(session.marketStatus).toBe("Open");
  });

  it("reports closed after 3:30 PM", () => {
    const session = getMarketSession(WED_AFTER_CLOSE);
    expect(session.status).toBe("closed");
    expect(session.marketCloseNote).toMatch(/9:30/);
  });

  it("reports closed on weekends", () => {
    const session = getMarketSession(SAT_MORNING);
    expect(session.status).toBe("closed");
    expect(session.marketCloseNote).toMatch(/Monday/);
  });
});
