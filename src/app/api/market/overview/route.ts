import { NextResponse } from "next/server";

import { getMarketOverviewData } from "@/lib/api/market-provider";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";

export const revalidate = 60;

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limit = checkRateLimit(`market-overview:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const data = await getMarketOverviewData();
  return NextResponse.json(data, {
    headers: rateLimitHeaders(limit),
  });
}
