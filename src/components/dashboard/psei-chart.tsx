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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pseiData as defaultPseiData } from "@/lib/data/dashboard";
import { pseiYAxisDomain } from "@/lib/market/psei-chart";
import type { PseiDataPoint } from "@/lib/types/stock";

export function PseiChart({ data = defaultPseiData }: { data?: PseiDataPoint[] }) {
  const mounted = useIsClient();
  const chartData = data.map((d) => ({ date: d.date, price: d.value }));
  const yDomain = pseiYAxisDomain(chartData.map((d) => d.price));

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
          {chartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No index history yet. Run{" "}
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                npm run ingest:bars
              </code>{" "}
              to load daily bars.
            </p>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height={288} minWidth={0} minHeight={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    Number(v).toLocaleString("en-PH", { maximumFractionDigits: 0 })
                  }
                />
                <Tooltip content={<PseiChartTooltip />} />
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

function PseiChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | null; payload?: { date?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const value = payload[0]?.value;
  if (value == null) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{point?.date}</p>
      <p className="tabular-nums text-muted-foreground">
        {value.toLocaleString("en-PH", { maximumFractionDigits: 2 })} pts
      </p>
    </div>
  );
}

function PseiSkeleton() {
  return <div className="h-full animate-pulse rounded-lg bg-muted/30" />;
}
