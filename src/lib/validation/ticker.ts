import { z } from "zod";

import { TICKER_PATHS, TICKER_BY_SYMBOL } from "@/lib/constants/tickers";

export const tickerPathSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((p) => TICKER_PATHS.has(p), "Unsupported ticker path");

export const tickerSymbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((t) => TICKER_BY_SYMBOL[t] != null, "Unsupported ticker symbol");

export const historyRangeSchema = z.enum(["7d", "30d", "90d", "1y"]).default("30d");

export const forecastHorizonSchema = z.enum(["3d", "7d", "14d", "30d"]).default("7d");

export const forecastModelSchema = z
  .enum(["lstm", "linear", "ma", "naive"])
  .default("lstm");
