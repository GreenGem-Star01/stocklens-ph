import { notFound } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { StockAiInsight } from "@/components/stock/stock-ai-insight";
import { StockDisclaimerAlert } from "@/components/stock/stock-disclaimer-alert";
import { StockForecastSection } from "@/components/stock/stock-forecast-section";
import { StockHeader } from "@/components/stock/stock-header";
import { StockMarketContext } from "@/components/stock/stock-market-context";
import { StockMetrics } from "@/components/stock/stock-metrics";
import { StockModelComparison } from "@/components/stock/stock-model-comparison";
import { StockPerformance } from "@/components/stock/stock-performance";
import { StockTechnicalSection } from "@/components/stock/stock-technical-section";
import { pathToTicker } from "@/lib/forecast";
import { isAnalyzedTicker, getPseCompanyByTicker } from "@/lib/pse/universe";
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

  const company = getPseCompanyByTicker(ticker);
  if (!company) {
    notFound();
  }

  let analysis;
  try {
    analysis = await getStockAnalysis(ticker);
  } catch {
    notFound();
  }

  const showNarrative = isAnalyzedTicker(ticker);

  return (
    <PageShell>
      <StockHeader analysis={analysis} />
      <StockMetrics analysis={analysis} />
      <StockTechnicalSection analysis={analysis} />
      <StockForecastSection analysis={analysis} />
      <StockDisclaimerAlert />
      <StockModelComparison analysis={analysis} />
      <StockPerformance analysis={analysis} />
      {showNarrative ? (
        <>
          <StockAiInsight analysis={analysis} />
          <StockMarketContext analysis={analysis} />
        </>
      ) : null}
    </PageShell>
  );
}
