"use client";

import { useEffect, useState } from "react";

import { useIsClient } from "@/lib/hooks/use-is-client";
import { getMarketSession, type MarketSession } from "@/lib/market/pse-session";

const RECHECK_INTERVAL_MS = 60_000;

const CLOSED_FALLBACK: MarketSession = {
  status: "closed",
  marketStatus: "Closed",
  marketCloseNote: "",
};

/** Client-reactive wrapper around getMarketSession() — rechecks every
 * minute so components know when the market transitions open/closed.
 * getMarketSession() is a cheap pure function, so it's called fresh on
 * every render; the interval only forces a re-render (via a tick
 * counter), it never sets derived state directly in the effect body. */
export function useMarketSession(): MarketSession {
  const isClient = useIsClient();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isClient) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, RECHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isClient]);

  return isClient ? getMarketSession() : CLOSED_FALLBACK;
}
