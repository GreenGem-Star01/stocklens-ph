import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { buildMarketAnalysis } from "@/lib/data/build-market-analysis";
import { FORECAST_DISCLAIMER, pathToTicker } from "@/lib/forecast";
import { walkForwardBacktest, metricsToComparisonRows } from "@/lib/forecast/backtest";
import { generateForecast } from "@/lib/forecast/generate";
import { horizonToDays } from "@/lib/forecast/horizon";
import type { BaselineModel, ForecastModel } from "@/lib/forecast/types";
import { getDailyBars } from "@/lib/market/bars-repository";
import { getLatestQuotes } from "@/lib/market/quotes-repository";
import { tickerToSymbol } from "@/lib/market/symbol";
import { buildForecastFromAnalysis } from "@/lib/services/forecast-service";
import {
  forecastHorizonSchema,
  forecastModelSchema,
  tickerPathSchema,
} from "@/lib/validation/ticker";

export const revalidate = 300;

type RouteContext = { params: Promise<{ ticker: string }> };

// Presets, not a free-form number — matches every other forecast control
// (Range/Horizon/Model) in this app being a Select over a fixed option set.
const TUNABLE_PARAM_PRESETS: Partial<Record<BaselineModel, number[]>> = {
  ma: [10, 20, 50],
  linear: [15, 30, 60],
};
// Live single-ticker backtest needs at least this many bars — mirrors the
// same threshold build-market-analysis.ts's loadForecastPoints uses.
const MIN_BARS_FOR_LIVE_TUNING = 60;

function parseTunableParam(
  model: ForecastModel,
  raw: string | null,
): number | undefined {
  if (!raw) return undefined;
  const presets = TUNABLE_PARAM_PRESETS[model as BaselineModel];
  if (!presets) return undefined;
  const n = Number(raw);
  return presets.includes(n) ? n : undefined;
}

export async function GET(request: Request, context: RouteContext) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = await checkRateLimit(`stock-forecast:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { ticker: path } = await context.params;
  const parsed = tickerPathSchema.safeParse(path);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const horizon = forecastHorizonSchema.safeParse(
    searchParams.get("horizon") ?? "7d",
  );
  const model = forecastModelSchema.safeParse(
    searchParams.get("model") ?? "linear",
  );
  if (!horizon.success || !model.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const symbol = pathToTicker(parsed.data);
  if (!symbol) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const quotes = await getLatestQuotes([symbol]);
  const quote = quotes.get(tickerToSymbol(symbol));
  const bars = await getDailyBars(symbol, "1y");
  const analysis = await buildMarketAnalysis(symbol, quote, bars, {
    model: model.data as ForecastModel,
    horizon: horizon.data,
  });

  if (!analysis) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const forecast = buildForecastFromAnalysis(analysis, model.data);
  const horizonDays = horizonToDays(horizon.data);
  const param = parseTunableParam(model.data as ForecastModel, searchParams.get("param"));

  // Live tuning overrides chartData/adds customPerformance using the bars
  // already fetched above — buildMarketAnalysis itself is left untouched
  // since it's shared with the stock page's SSR render. Guarded on bar
  // count: getDailyBars returns [] outside MARKET_DATA_SOURCE=db, and
  // without this guard a static-mode request would silently blank out
  // buildMarketAnalysis's good snapshot-derived chartData.
  let chartData = analysis.chartData;
  let customPerformance = null;
  if (param !== undefined && bars.length >= MIN_BARS_FOR_LIVE_TUNING) {
    chartData = generateForecast(bars, model.data as ForecastModel, horizonDays, 90, param);
    const customModel = model.data as BaselineModel;
    const metrics = walkForwardBacktest(bars, horizonDays, [customModel], param);
    customPerformance = metricsToComparisonRows(metrics)[0] ?? null;
  }

  return NextResponse.json(
    {
      ...forecast,
      horizon: horizon.data,
      model: model.data,
      param: param ?? null,
      chartData,
      performance: analysis.performance,
      modelComparison: analysis.modelComparison,
      customPerformance,
      disclaimer: FORECAST_DISCLAIMER,
    },
    { headers: rateLimitHeaders(limit) },
  );
}
