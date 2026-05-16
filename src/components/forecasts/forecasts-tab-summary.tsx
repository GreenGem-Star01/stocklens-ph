"use client";

import { forecastSummary } from "@/lib/data/forecasts";

type ForecastsTabSummaryProps = {
  tab: string;
  upwardCount: number;
  downwardCount: number;
};

export function ForecastsTabSummary({
  tab,
  upwardCount,
  downwardCount,
}: ForecastsTabSummaryProps) {
  if (tab === "upward") {
    return (
      <p className="text-sm text-muted-foreground">
        {upwardCount} stock{upwardCount === 1 ? "" : "s"} with projected upward
        movement
      </p>
    );
  }

  if (tab === "downward") {
    return (
      <p className="text-sm text-muted-foreground">
        {downwardCount} stock{downwardCount === 1 ? "" : "s"} with projected
        downward movement
      </p>
    );
  }

  if (tab === "performance") {
    return (
      <p className="text-sm text-muted-foreground">
        Average LSTM directional accuracy: {forecastSummary.averageAccuracy}
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {forecastSummary.upwardCount} of {forecastSummary.totalToday} projected
      upward ({forecastSummary.upwardPercent})
    </p>
  );
}
