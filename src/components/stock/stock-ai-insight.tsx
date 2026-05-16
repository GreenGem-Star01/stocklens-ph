import { Lightbulb } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockAiInsight({ analysis }: { analysis: StockAnalysis }) {
  const { aiInsight } = analysis;
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle>AI Insight</CardTitle>
        </div>
        <CardDescription>
          Plain-language interpretation of the forecast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{aiInsight.summary}</p>
        <p className="text-muted-foreground">{aiInsight.caution}</p>
        <p className="text-muted-foreground">{aiInsight.context}</p>
      </CardContent>
    </Card>
  );
}
