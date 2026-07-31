"use client";

import type { ForecastsPayload } from "@/lib/api/market-provider/types";

type ForecastsTabSummaryProps = {
  tab: string;
  upwardCount: number;
  downwardCount: number;
  summary: ForecastsPayload["summary"];
};

export function ForecastsTabSummary({
  tab,
  upwardCount,
  downwardCount,
  summary,
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
        Average best-fit directional accuracy: {summary.averageAccuracy}
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {summary.upwardCount} of {summary.totalToday} projected upward (
      {summary.upwardPercent})
    </p>
  );
}
