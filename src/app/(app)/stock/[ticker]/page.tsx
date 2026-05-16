import { notFound } from "next/navigation";

import { StockAiInsight } from "@/components/stock/stock-ai-insight";
import { StockDisclaimerAlert } from "@/components/stock/stock-disclaimer-alert";
import { StockForecastSection } from "@/components/stock/stock-forecast-section";
import { StockHeader } from "@/components/stock/stock-header";
import { StockMarketContext } from "@/components/stock/stock-market-context";
import { StockMetrics } from "@/components/stock/stock-metrics";
import { StockModelComparison } from "@/components/stock/stock-model-comparison";
import { StockPerformance } from "@/components/stock/stock-performance";
import { pathToTicker } from "@/lib/forecast";
import { APP_PAGE_CLASS } from "@/lib/layout";
import { getStockAnalysis } from "@/lib/services/stock-service";

type StockPageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function StockPage({ params }: StockPageProps) {
  const { ticker: path } = await params;
  const ticker = pathToTicker(path);
  if (!ticker) {
    notFound();
  }

  let analysis;
  try {
    analysis = await getStockAnalysis(ticker);
  } catch {
    notFound();
  }

  return (
    <div className={APP_PAGE_CLASS}>
      <StockHeader analysis={analysis} />
      <StockMetrics analysis={analysis} />
      <StockForecastSection analysis={analysis} />
      <StockDisclaimerAlert />
      <StockModelComparison analysis={analysis} />
      <StockPerformance analysis={analysis} />
      <StockAiInsight analysis={analysis} />
      <StockMarketContext analysis={analysis} />
    </div>
  );
}
