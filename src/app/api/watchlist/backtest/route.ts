import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from "@/lib/api/rate-limit";
import { isDbMarketEnabled } from "@/lib/db/config";
import {
  aggregatePortfolioMetrics,
  bestPortfolioModel,
  walkForwardBacktest,
} from "@/lib/forecast/backtest";
import type { ForecastModel, ModelMetrics } from "@/lib/forecast/types";
import { getDailyBars } from "@/lib/market/bars-repository";
import { getAllMetricsFromSnapshot } from "@/lib/market/forecasts-snapshot";
import { tickerToSymbol } from "@/lib/market/symbol";
import { tickerSymbolSchema } from "@/lib/validation/ticker";

// Route-local: walkForwardBacktest/FORECAST_HORIZONS only support 7 and 30
// day horizons, unlike the shared forecastHorizonSchema (which also allows
// 3d/14d for the single-ticker forecast chart).
const horizonSchema = z.enum(["7d", "30d"]).default("7d");
const MAX_TICKERS = 6;

export const revalidate = 300;

type Skipped = { ticker: string; reason: string };

// Static/Vercel deploys have no live Postgres bar history to run a
// walk-forward backtest against, but the published forecasts snapshot
// already carries the same per-symbol, per-model walk-forward metrics
// computed by `ingest:forecasts` — reuse aggregatePortfolioMetrics/
// bestPortfolioModel against those instead of disabling the feature.
async function staticBacktestResponse(
  validTickers: string[],
  horizonDays: number,
  tickersSkipped: Skipped[],
  limit: RateLimitResult,
): Promise<NextResponse> {
  const metricsForHorizon = (await getAllMetricsFromSnapshot()).filter(
    (m) => m.horizonDays === horizonDays,
  );

  if (metricsForHorizon.length === 0) {
    return NextResponse.json(
      { available: false, reason: "static" },
      { headers: rateLimitHeaders(limit) },
    );
  }

  const perTickerMetrics: ModelMetrics[][] = [];
  const tickersUsed: string[] = [];

  for (const ticker of validTickers) {
    const symbol = tickerToSymbol(ticker);
    const rows = metricsForHorizon.filter((m) => m.symbol === symbol);
    if (rows.length === 0) {
      tickersSkipped.push({ ticker, reason: "no forecast history available" });
      continue;
    }
    perTickerMetrics.push(
      rows.map((r) => ({
        model: r.model as ForecastModel,
        horizonDays: r.horizonDays,
        mae: r.mae,
        rmse: r.rmse,
        mape: r.mape,
        dirAccuracy: r.dirAccuracy,
      })),
    );
    tickersUsed.push(ticker);
  }

  const models = aggregatePortfolioMetrics(perTickerMetrics, horizonDays);
  const best = bestPortfolioModel(models);

  return NextResponse.json(
    {
      available: true,
      horizonDays,
      models,
      bestModel: best?.model ?? null,
      tickersUsed,
      tickersSkipped,
    },
    { headers: rateLimitHeaders(limit) },
  );
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = await checkRateLimit(`watchlist-backtest:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { searchParams } = new URL(request.url);

  const horizonParsed = horizonSchema.safeParse(searchParams.get("horizon") ?? "7d");
  if (!horizonParsed.success) {
    return NextResponse.json({ error: "Invalid horizon" }, { status: 400 });
  }
  const horizonDays = horizonParsed.data === "30d" ? 30 : 7;

  const tickersParam = searchParams.get("tickers") ?? "";
  const rawTickers = tickersParam
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_TICKERS);

  const validTickers: string[] = [];
  const tickersSkipped: Skipped[] = [];
  for (const raw of rawTickers) {
    const parsed = tickerSymbolSchema.safeParse(raw);
    if (parsed.success) {
      validTickers.push(parsed.data);
    } else {
      tickersSkipped.push({ ticker: raw, reason: "unsupported ticker" });
    }
  }

  if (!isDbMarketEnabled()) {
    return staticBacktestResponse(validTickers, horizonDays, tickersSkipped, limit);
  }

  const barsPerTicker = await Promise.all(
    validTickers.map((ticker) => getDailyBars(ticker, "1y")),
  );

  const perTickerMetrics: ModelMetrics[][] = [];
  const tickersUsed: string[] = [];

  validTickers.forEach((ticker, i) => {
    const metrics = walkForwardBacktest(barsPerTicker[i]!, horizonDays);
    if (metrics.length === 0) {
      tickersSkipped.push({ ticker, reason: "insufficient price history" });
      return;
    }
    perTickerMetrics.push(metrics);
    tickersUsed.push(ticker);
  });

  const models = aggregatePortfolioMetrics(perTickerMetrics, horizonDays);
  const best = bestPortfolioModel(models);

  return NextResponse.json(
    {
      available: true,
      horizonDays,
      models,
      bestModel: best?.model ?? null,
      tickersUsed,
      tickersSkipped,
    },
    { headers: rateLimitHeaders(limit) },
  );
}
