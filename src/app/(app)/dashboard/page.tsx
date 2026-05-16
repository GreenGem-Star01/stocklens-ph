import { FeaturedStocks } from "@/components/dashboard/featured-stocks";
import { ForecastDisclaimer } from "@/components/dashboard/forecast-disclaimer";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { PseiChart } from "@/components/dashboard/psei-chart-lazy";
import { RecentAnalysisTable } from "@/components/dashboard/recent-analysis-table";
import { StockSearch } from "@/components/dashboard/stock-search";
import { getMarketOverview } from "@/lib/services/market-service";

export default async function DashboardPage() {
  const market = await getMarketOverview();

  return (
    <div className="container mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      <StockSearch />
      <MarketOverview data={market.overview} />
      <FeaturedStocks stocks={market.featured} />
      <PseiChart data={market.pseiChart} />
      <RecentAnalysisTable rows={market.recent} />
      <ForecastDisclaimer />
    </div>
  );
}
