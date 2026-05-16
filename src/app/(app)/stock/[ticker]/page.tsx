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
    <div className="container mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <StockHeader analysis={analysis} />
      <StockMetrics analysis={analysis} />
      <StockForecastSection analysis={analysis} />
      <StockDisclaimerAlert />
      <StockPerformance analysis={analysis} />
      <StockModelComparison analysis={analysis} />
      <StockAiInsight analysis={analysis} />
      <StockMarketContext analysis={analysis} />
    </div>
  );
}
