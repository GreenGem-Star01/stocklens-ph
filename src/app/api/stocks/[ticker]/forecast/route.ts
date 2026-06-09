import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { buildMarketAnalysis } from "@/lib/data/build-market-analysis";
import { FORECAST_DISCLAIMER, pathToTicker } from "@/lib/forecast";
import type { ForecastModel } from "@/lib/forecast/types";
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

export async function GET(request: Request, context: RouteContext) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = checkRateLimit(`stock-forecast:${ip}`);
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

  return NextResponse.json(
    {
      ...forecast,
      horizon: horizon.data,
      model: model.data,
      chartData: analysis.chartData,
      performance: analysis.performance,
      modelComparison: analysis.modelComparison,
      disclaimer: FORECAST_DISCLAIMER,
    },
    { headers: rateLimitHeaders(limit) },
  );
}
