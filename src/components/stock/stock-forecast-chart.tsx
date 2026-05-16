"use client";

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

import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function StockForecastChart({ analysis }: { analysis: StockAnalysis }) {
  return (
    <div className="h-[500px] min-h-[320px] min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={analysis.chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            domain={analysis.chartDomain}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}
          />
          <ReferenceLine
            x={analysis.forecastStartDate}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{
              value: "Forecast starts here →",
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
            name="LSTM Forecast"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
