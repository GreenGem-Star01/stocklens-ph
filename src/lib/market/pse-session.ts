export type MarketSessionStatus = "open" | "closed";

export type MarketSession = {
  status: MarketSessionStatus;
  marketStatus: string;
  marketCloseNote: string;
};

const MANILA_TZ = "Asia/Manila";
const SESSION_OPEN_MINUTES = 9 * 60 + 30;
const SESSION_CLOSE_MINUTES = 15 * 60 + 30;

function manilaClock(now: Date): { weekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return { weekday, minutes: hour * 60 + minute };
}

/** PSE regular session (weekdays 9:30–15:30 Manila). Holidays not modeled in v1. */
export function getMarketSession(now: Date = new Date()): MarketSession {
  const { weekday, minutes } = manilaClock(now);

  if (weekday === "Sat" || weekday === "Sun") {
    return {
      status: "closed",
      marketStatus: "Closed",
      marketCloseNote: "Opens Monday 9:30 AM (Manila)",
    };
  }

  if (minutes >= SESSION_OPEN_MINUTES && minutes < SESSION_CLOSE_MINUTES) {
    return {
      status: "open",
      marketStatus: "Open",
      marketCloseNote: "Closes at 3:30 PM (Manila)",
    };
  }

  if (minutes < SESSION_OPEN_MINUTES) {
    return {
      status: "closed",
      marketStatus: "Closed",
      marketCloseNote: "Opens at 9:30 AM (Manila)",
    };
  }

  return {
    status: "closed",
    marketStatus: "Closed",
    marketCloseNote: "Next session 9:30 AM (Manila)",
  };
}

export function applyMarketSession<
  T extends { marketStatus: string; marketCloseNote: string },
>(overview: T, now?: Date): T {
  const session = getMarketSession(now);
  return {
    ...overview,
    marketStatus: session.marketStatus,
    marketCloseNote: session.marketCloseNote,
  };
}
