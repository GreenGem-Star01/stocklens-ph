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

// Naive Baseline is the default, not LSTM: real walk-forward backtests
// across the full PSE universe consistently show LSTM as the weakest
// model here (worst MAE/RMSE/MAPE and the lowest directional accuracy,
// barely above a coin flip) — see the Model Performance tab on
// /forecasts. Don't default users into the model that backtests worst.
export const forecastModelSchema = z
  .enum(["lstm", "linear", "ma", "naive"])
  .default("naive");
