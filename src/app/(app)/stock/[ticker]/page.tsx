import { notFound } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { StockAiInsight } from "@/components/stock/stock-ai-insight";
import { StockCatalogHeader } from "@/components/stock/stock-catalog-header";
import { StockCatalogProfile } from "@/components/stock/stock-catalog-profile";
import { StockDisclaimerAlert } from "@/components/stock/stock-disclaimer-alert";
import { StockForecastSection } from "@/components/stock/stock-forecast-section";
import { StockHeader } from "@/components/stock/stock-header";
import { StockMarketContext } from "@/components/stock/stock-market-context";
import { StockMetrics } from "@/components/stock/stock-metrics";
import { StockModelComparison } from "@/components/stock/stock-model-comparison";
import { StockPerformance } from "@/components/stock/stock-performance";
import { getQuotesForSymbols } from "@/lib/api/market-provider";
import { pathToTicker } from "@/lib/forecast";
import { tickerToSymbol } from "@/lib/market/symbol";
import {
  getPseCompanyByTicker,
  isAnalyzedTicker,
} from "@/lib/pse/universe";
import { getStockAnalysis } from "@/lib/services/stock-service";
import { StockCatalogMetrics } from "@/components/stock/stock-catalog-metrics";

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

  if (!isAnalyzedTicker(ticker)) {
    const quotes = await getQuotesForSymbols([ticker]);
    const quote = quotes.get(tickerToSymbol(ticker)) ?? null;

    return (
      <PageShell>
        <StockCatalogHeader company={company} />
        <StockCatalogMetrics company={company} quote={quote} />
        <StockCatalogProfile company={company} />
      </PageShell>
    );
  }

  let analysis;
  try {
    analysis = await getStockAnalysis(ticker);
  } catch {
    notFound();
  }

  return (
    <PageShell>
      <StockHeader analysis={analysis} />
      <StockMetrics analysis={analysis} />
      <StockForecastSection analysis={analysis} />
      <StockDisclaimerAlert />
      <StockModelComparison analysis={analysis} />
      <StockPerformance analysis={analysis} />
      <StockAiInsight analysis={analysis} />
      <StockMarketContext analysis={analysis} />
    </PageShell>
  );
}
