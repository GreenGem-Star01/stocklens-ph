import { FeaturedStocks } from "@/components/dashboard/featured-stocks";
import { ForecastDisclaimer } from "@/components/dashboard/forecast-disclaimer";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { PseiChart } from "@/components/dashboard/psei-chart-lazy";
import { RecentAnalysisTable } from "@/components/dashboard/recent-analysis-table";
import { StockSearch } from "@/components/dashboard/stock-search";
import { APP_PAGE_CLASS } from "@/lib/layout";
import { getMarketOverview } from "@/lib/services/market-service";

export default async function DashboardPage() {
  const market = await getMarketOverview();

  return (
    <div className={APP_PAGE_CLASS}>
      <StockSearch />
      <MarketOverview data={market.overview} />
      <FeaturedStocks stocks={market.featured} />
      <PseiChart data={market.pseiChart} />
      <RecentAnalysisTable rows={market.recent} />
      <ForecastDisclaimer />
    </div>
  );
}
