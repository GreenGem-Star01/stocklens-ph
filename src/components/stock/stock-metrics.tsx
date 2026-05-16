import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PriceChange, PriceDirectionIcon } from "@/components/ui/price-change";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockMetrics({ analysis }: { analysis: StockAnalysis }) {
  const { metrics } = analysis;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Last Close</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-3xl font-semibold">{metrics.lastClose}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Daily Change</CardDescription>
        </CardHeader>
        <CardContent>
          <DailyChangeValue metrics={metrics} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{metrics.volume}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>52-Week Range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{metrics.weekRange}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function DailyChangeValue({
  metrics,
}: {
  metrics: StockAnalysis["metrics"];
}) {
  return (
    <div className="flex items-center gap-2">
      <PriceChange
        change={metrics.dailyChange}
        positive={metrics.dailyChangePositive}
        className="text-3xl font-semibold"
      />
      <PriceDirectionIcon
        positive={metrics.dailyChangePositive}
        className="h-6 w-6"
      />
    </div>
  );
}
