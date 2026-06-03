import { NextResponse } from "next/server";

import { getStockAnalysisData } from "@/lib/api/market-provider";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { tickerPathSchema } from "@/lib/validation/ticker";
import { pathToTicker } from "@/lib/forecast";

export const revalidate = 60;

type RouteContext = { params: Promise<{ ticker: string }> };

export async function GET(request: Request, context: RouteContext) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = checkRateLimit(`stock-analysis:${ip}`);
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

  const symbol = pathToTicker(parsed.data);
  if (!symbol) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const analysis = await getStockAnalysisData(symbol);
  if (!analysis) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  return NextResponse.json(analysis, { headers: rateLimitHeaders(limit) });
}
