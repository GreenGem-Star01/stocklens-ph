import {
  getDbFallbackMeta,
  getMarketOverviewData,
} from "@/lib/api/market-provider";

export async function getMarketOverview() {
  const data = await getMarketOverviewData();
  const fallback = getDbFallbackMeta();
  return {
    ...data,
    dbUnreachable: fallback.usedFallback,
    dbUnreachableReason: fallback.fallbackReason,
  };
}
