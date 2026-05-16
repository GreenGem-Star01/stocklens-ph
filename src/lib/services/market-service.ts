import { getMarketOverviewData } from "@/lib/api/market-provider";

export async function getMarketOverview() {
  return getMarketOverviewData();
}
