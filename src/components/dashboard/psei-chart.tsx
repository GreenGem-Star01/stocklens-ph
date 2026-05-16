"use client";

import { useIsClient } from "@/lib/hooks/use-is-client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pseiData as defaultPseiData } from "@/lib/data/dashboard";
import type { PseiDataPoint } from "@/lib/types/stock";

export function PseiChart({ data = defaultPseiData }: { data?: PseiDataPoint[] }) {
  const mounted = useIsClient();
  const chartData = data.map((d) => ({ date: d.date, price: d.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>PSEi Index Movement</CardTitle>
        <CardDescription>Last 8 trading days</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="h-72 min-h-[200px] min-w-0 w-full"
          role="img"
          aria-label="PSEi index line chart for the last eight trading days"
        >
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[6400, 6500]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--primary)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <PseiSkeleton />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PseiSkeleton() {
  return <div className="h-full animate-pulse rounded-lg bg-muted/30" />;
}
