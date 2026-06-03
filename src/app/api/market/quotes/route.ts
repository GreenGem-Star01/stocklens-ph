import { NextResponse } from "next/server";

import { getQuotesForSymbols } from "@/lib/api/market-provider";
import { toQuotesMap } from "@/lib/market/quotes-map";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { quoteToDisplay } from "@/lib/market/format-quote";
import { symbolToTicker } from "@/lib/market/symbol";

export const revalidate = 60;

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = checkRateLimit(`market-quotes:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = symbolsParam
    ? symbolsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)
    : undefined;

  const quoteMap = toQuotesMap(await getQuotesForSymbols(symbols));
  const payload: Record<
    string,
    {
      lastClose: string;
      dailyChange: string;
      positive: boolean;
      direction: "up" | "down" | "flat";
      asOf: string;
    }
  > = {};

  for (const [symbol, quote] of quoteMap) {
    const ticker = symbolToTicker(symbol);
    const isIndex = symbol === "PSEI";
    const display = quoteToDisplay(quote, isIndex);
    payload[ticker] = {
      lastClose: display.lastClose,
      dailyChange: display.dailyChange,
      direction: display.direction,
      positive: display.direction === "up",
      asOf: quote.asOf.toISOString(),
    };
  }

  return NextResponse.json(
    { quotes: payload, count: Object.keys(payload).length },
    { headers: rateLimitHeaders(limit) },
  );
}
