"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tickerToPath } from "@/lib/forecast";
import type { IndicatorPoint } from "@/lib/market/indicators";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

const StockTechnicalChart = dynamic(
  () =>
    import("@/components/stock/stock-technical-chart").then(
      (m) => m.StockTechnicalChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[720px] animate-pulse rounded-lg border bg-muted/30" />
    ),
  },
);

export function StockTechnicalSection({
  analysis,
}: {
  analysis: StockAnalysis;
}) {
  const [range, setRange] = useState("90d");
  const [points, setPoints] = useState<IndicatorPoint[]>([]);
  const [forecastPoints, setForecastPoints] = useState(analysis.chartData);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(
    async (nextRange: string) => {
      setLoading(true);
      try {
        const path = tickerToPath(analysis.info.ticker);
        const res = await fetch(`/api/stocks/${path}/indicators?range=${nextRange}`);
        if (res.ok) {
          const data = (await res.json()) as { points: IndicatorPoint[] };
          setPoints(data.points);
        }
      } finally {
        setLoading(false);
      }
    },
    [analysis.info.ticker],
  );

  useEffect(() => {
    void refetch(range);
  }, [range, refetch]);

  useEffect(() => {
    setForecastPoints(analysis.chartData);
  }, [analysis.chartData]);

  const isIndex = analysis.info.sector === "Index";

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">Technical Analysis</CardTitle>
            <CardDescription className="mt-1">
              SMA, volume, RSI, and MACD computed from daily OHLCV bars.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Range:</span>
            <Select value={range} onValueChange={(v) => v && setRange(v)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <StockTechnicalChart
            points={points}
            isIndex={isIndex}
            forecastPoints={forecastPoints}
          />
          {loading ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50"
              aria-busy="true"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
