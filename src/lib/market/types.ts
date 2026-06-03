export type MarketQuote = {
  symbol: string;
  lastClose: number;
  changePct: number;
  changeAbs: number | null;
  volume: number | null;
  asOf: Date;
  source: string;
};

export type MarketBar = {
  symbol: string;
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

export type BarRange = "7d" | "30d" | "90d" | "1y";

export const BAR_RANGE_DAYS: Record<BarRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

import type { PriceDirection } from "@/lib/market/change-direction";

export type QuoteDisplay = {
  lastClose: string;
  dailyChange: string;
  direction: PriceDirection;
  /** @deprecated Use `direction`; true only when direction is `"up"`. */
  positive: boolean;
  volume: string;
};
