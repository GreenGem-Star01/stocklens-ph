"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useIsClient } from "@/lib/hooks/use-is-client";
import { formatStockChartTick } from "@/lib/market/chart-domain";
import type { IndicatorPoint } from "@/lib/market/indicators";

type StockTechnicalChartProps = {
  points: IndicatorPoint[];
  isIndex?: boolean;
  forecastPoints?: Array<{ date: string; forecast: number | null }>;
};

function Panel({
  title,
  height,
  children,
}: {
  title: string;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div style={{ height }} className="min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}

export function StockTechnicalChart({
  points,
  isIndex = false,
  forecastPoints = [],
}: StockTechnicalChartProps) {
  const mounted = useIsClient();

  if (!mounted) {
    return (
      <div className="h-[720px] animate-pulse rounded-lg border bg-muted/30" />
    );
  }

  if (!points.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No bar history yet. Run <code className="mx-1">npm run ingest:bars</code>.
      </div>
    );
  }

  const forecastByDate = new Map(
    forecastPoints.filter((p) => p.forecast != null).map((p) => [p.date, p.forecast]),
  );

  const priceData = points.map((p) => ({
    ...p,
    forecast: forecastByDate.get(p.date) ?? null,
  }));

  const volumeData = points.map((p) => ({
    date: p.date,
    volume: p.volume,
  }));

  const rsiData = points.filter((p) => p.rsi14 != null);
  const macdData = points.filter((p) => p.macd != null);

  return (
    <div className="space-y-6" role="img" aria-label="Technical analysis chart">
      <Panel title="Price + SMA" height={280}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={!isIndex}
              tickFormatter={(v) => formatStockChartTick(Number(v), { isIndex })}
            />
            <Tooltip />
            <Line type="monotone" dataKey="close" stroke="var(--chart-1)" dot={false} name="Close" />
            <Line type="monotone" dataKey="sma20" stroke="var(--chart-2)" dot={false} name="SMA 20" />
            <Line type="monotone" dataKey="sma50" stroke="var(--chart-3)" dot={false} name="SMA 50" />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="var(--chart-4)"
              strokeDasharray="4 4"
              dot={false}
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Volume" height={120}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" hide />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="volume" fill="var(--chart-2)" opacity={0.7} name="Volume" />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="RSI (14)" height={120}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={rsiData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ReferenceLine y={30} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
            <ReferenceLine y={70} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
            <Tooltip />
            <Line type="monotone" dataKey="rsi14" stroke="var(--chart-1)" dot={false} name="RSI" />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="MACD" height={140}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={macdData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" hide />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="macdHist" fill="var(--chart-3)" opacity={0.5} name="Histogram" />
            <Line type="monotone" dataKey="macd" stroke="var(--chart-1)" dot={false} name="MACD" />
            <Line
              type="monotone"
              dataKey="macdSignal"
              stroke="var(--chart-2)"
              dot={false}
              name="Signal"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
