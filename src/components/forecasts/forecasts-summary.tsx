import { BarChart3, Calendar, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { forecastSummary } from "@/lib/data/forecasts";

export function ForecastsSummary() {
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
          <div className="text-3xl font-semibold">{forecastSummary.totalToday}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Last updated: {forecastSummary.lastUpdated}
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
            {forecastSummary.averageAccuracy}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            LSTM directional accuracy
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
          <div className="text-3xl font-semibold">{forecastSummary.upwardCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {forecastSummary.upwardPercent} of all forecasts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
