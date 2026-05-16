"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockAiInsight({ analysis }: { analysis: StockAnalysis }) {
  const show = useSettingsStore((s) => s.displayAiInsights);
  if (!show) return null;

  const { aiInsight } = analysis;

  return (
    <Collapsible defaultOpen>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <div>
              <CardTitle>AI Market Insight</CardTitle>
              <CardDescription>Plain-language forecast interpretation</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">Toggle</span>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>{aiInsight.summary}</p>
            <p>{aiInsight.caution}</p>
            <p>{aiInsight.context}</p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
