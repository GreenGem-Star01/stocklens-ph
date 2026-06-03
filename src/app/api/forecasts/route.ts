import { NextResponse } from "next/server";

import { getForecastsData } from "@/lib/api/market-provider";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";
import { forecastHorizonSchema, forecastModelSchema, tickerSymbolSchema } from "@/lib/validation/ticker";
import { getForecasts } from "@/lib/services/forecast-service";

export const revalidate = 300;

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = checkRateLimit(`forecasts:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get("ticker");
  const horizonParam = searchParams.get("horizon");
  const modelParam = searchParams.get("model");

  if (tickerParam) {
    const t = tickerSymbolSchema.safeParse(tickerParam);
    if (!t.success) {
      return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
    }
  }
  if (horizonParam) {
    const h = forecastHorizonSchema.safeParse(horizonParam);
    if (!h.success) {
      return NextResponse.json({ error: "Invalid horizon" }, { status: 400 });
    }
  }
  if (modelParam) {
    const m = forecastModelSchema.safeParse(modelParam);
    if (!m.success) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }
  }

  const data =
    tickerParam || modelParam
      ? await getForecasts({
          ticker: tickerParam ?? undefined,
          horizon: horizonParam ?? undefined,
          model: modelParam ?? undefined,
        })
      : await getForecastsData();

  return NextResponse.json(
    {
      ...data,
      disclaimer: FORECAST_DISCLAIMER,
    },
    { headers: rateLimitHeaders(limit) },
  );
}
