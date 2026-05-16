import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { pathToTicker } from "@/lib/forecast";
import { buildForecastFromAnalysis } from "@/lib/services/forecast-service";
import { getStockAnalysisData } from "@/lib/api/market-provider";
import {
  forecastHorizonSchema,
  forecastModelSchema,
  tickerPathSchema,
} from "@/lib/validation/ticker";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";

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
    searchParams.get("model") ?? "lstm",
  );
  if (!horizon.success || !model.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const symbol = pathToTicker(parsed.data);
  if (!symbol) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const analysis = getStockAnalysisData(symbol);
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
      disclaimer: FORECAST_DISCLAIMER,
    },
    { headers: rateLimitHeaders(limit) },
  );
}
