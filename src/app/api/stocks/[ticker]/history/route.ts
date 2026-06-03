import { NextResponse } from "next/server";

import { getStockHistoryData } from "@/lib/api/market-provider";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { historyRangeSchema, tickerPathSchema } from "@/lib/validation/ticker";
import { pathToTicker } from "@/lib/forecast";

export const revalidate = 60;

type RouteContext = { params: Promise<{ ticker: string }> };

export async function GET(request: Request, context: RouteContext) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = checkRateLimit(`stock-history:${ip}`);
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
  const rangeResult = historyRangeSchema.safeParse(
    searchParams.get("range") ?? "30d",
  );
  if (!rangeResult.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const symbol = pathToTicker(parsed.data);
  if (!symbol) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const points = await getStockHistoryData(symbol, rangeResult.data);
  if (!points) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  return NextResponse.json(
    { ticker: symbol, range: rangeResult.data, points },
    { headers: rateLimitHeaders(limit) },
  );
}
