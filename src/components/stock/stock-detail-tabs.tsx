"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForecastDisclaimer } from "@/components/dashboard/forecast-disclaimer";
import { StockAiInsight } from "@/components/stock/stock-ai-insight";
import { StockForecastSection } from "@/components/stock/stock-forecast-section";
import { StockMarketContext } from "@/components/stock/stock-market-context";
import { StockModelComparison } from "@/components/stock/stock-model-comparison";
import { StockPerformance } from "@/components/stock/stock-performance";
import { StockTechnicalSection } from "@/components/stock/stock-technical-section";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockDetailTabs({
  analysis,
  showNarrative,
}: {
  analysis: StockAnalysis;
  showNarrative: boolean;
}) {
  const [tab, setTab] = useState("technical");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value ?? "technical")} className="space-y-4">
      <TabsList className="sticky top-0 z-10 w-full justify-start overflow-x-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <TabsTrigger value="technical">Technical</TabsTrigger>
        <TabsTrigger value="forecast">Forecast</TabsTrigger>
        <TabsTrigger value="models">Models</TabsTrigger>
        {showNarrative ? <TabsTrigger value="insights">Insights</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="technical">
        <StockTechnicalSection analysis={analysis} />
      </TabsContent>

      <TabsContent value="forecast" className="space-y-4">
        <StockForecastSection analysis={analysis} />
        <ForecastDisclaimer />
      </TabsContent>

      <TabsContent value="models" className="space-y-4">
        <StockModelComparison analysis={analysis} />
        <StockPerformance analysis={analysis} />
      </TabsContent>

      {showNarrative ? (
        <TabsContent value="insights" className="space-y-4">
          <StockAiInsight analysis={analysis} />
          <StockMarketContext analysis={analysis} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
