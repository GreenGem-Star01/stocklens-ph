import { Badge } from "@/components/ui/badge";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockHeader({ analysis }: { analysis: StockAnalysis }) {
  const { info, lastUpdated } = analysis;
  return (
    <div className="border-b pb-4">
      <h1 className="text-3xl font-semibold">{info.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-lg text-muted-foreground">{info.ticker}</span>
        <Badge variant="outline">{info.sector}</Badge>
        <span className="ml-auto text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </span>
      </div>
    </div>
  );
}
