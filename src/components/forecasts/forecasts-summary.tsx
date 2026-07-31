import { BarChart3, Calendar, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { ForecastsPayload } from "@/lib/api/market-provider/types";

type ForecastsSummaryProps = {
  summary: ForecastsPayload["summary"];
};

export function ForecastsSummary({ summary }: ForecastsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardDescription>Total Forecasts Today</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{summary.totalToday}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Last updated: {summary.lastUpdated}
          </p>
        </CardContent>
      </Card>

      <Card className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardDescription>Average Model Accuracy</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {summary.averageAccuracy}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Best-fit model directional accuracy
          </p>
        </CardContent>
      </Card>

      <Card className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-trend-up" />
            <CardDescription>Projected Upward Forecasts</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{summary.upwardCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.upwardPercent} of all forecasts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
