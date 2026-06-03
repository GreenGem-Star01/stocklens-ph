"use client";

import { useIsClient } from "@/lib/hooks/use-is-client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend } from "@/components/charts/chart-legend";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { formatStockChartTick } from "@/lib/market/chart-domain";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockForecastChart({ analysis }: { analysis: StockAnalysis }) {
  const mounted = useIsClient();
  const isIndex = analysis.info.sector === "Index";

  if (!mounted) {
    return (
      <div className="h-[500px] min-h-[320px] animate-pulse rounded-lg border bg-muted/30" />
    );
  }

  return (
    <div
      className="h-[500px] min-h-[320px] min-w-0 w-full"
      role="img"
      aria-label={`Price chart for ${analysis.info.ticker} with historical and forecast lines`}
    >
      <ChartLegend />
      <ResponsiveContainer width="100%" height={460} minWidth={0} minHeight={320}>
        <LineChart data={analysis.chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            domain={analysis.chartDomain}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={!isIndex}
            tickFormatter={(v) => formatStockChartTick(Number(v), { isIndex })}
          />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine
            x={analysis.forecastStartDate}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{
              value: "Forecast starts",
              position: "top",
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Historical Price"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="var(--chart-1)"
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Forecast"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
