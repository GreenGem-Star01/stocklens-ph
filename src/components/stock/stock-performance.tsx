import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockPerformance({ analysis }: { analysis: StockAnalysis }) {
  const { performance } = analysis;
  return (
    <section>
      <h3 className="mb-4 text-lg font-medium">Forecast Performance Metrics</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="MAE (Mean Absolute Error)" value={performance.mae} hint="Lower is better" />
        <MetricCard label="RMSE (Root Mean Squared Error)" value={performance.rmse} hint="Lower is better" />
        <MetricCard label="MAPE (Mean Absolute % Error)" value={performance.mape} hint="Lower is better" />
        <MetricCard label="Directional Accuracy" value={performance.directionalAccuracy} hint="Higher is better" />
      </div>
    </section>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="card-interactive">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
