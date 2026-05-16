"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

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
import type { StockAnalysis } from "@/lib/types/stock-analysis";

const StockForecastChart = dynamic(
  () =>
    import("@/components/stock/stock-forecast-chart").then(
      (m) => m.StockForecastChart,
    ),
  {
    ssr: false,
    loading: () => (
      <ChartSkeleton />
    ),
  },
);

function ChartSkeleton() {
  return (
    <div className="h-[500px] animate-pulse rounded-lg border bg-muted/30" />
  );
}

export function StockForecastSection({ analysis }: { analysis: StockAnalysis }) {
  const [range, setRange] = useState("30d");
  const [horizon, setHorizon] = useState("7d");
  const [model, setModel] = useState("lstm");
  const [chartAnalysis, setChartAnalysis] = useState(analysis);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(
    async (nextRange: string, nextHorizon: string, nextModel: string) => {
      setLoading(true);
      try {
        const path = tickerToPath(analysis.info.ticker);
        const [historyRes, forecastRes] = await Promise.all([
          fetch(`/api/stocks/${path}/history?range=${nextRange}`),
          fetch(
            `/api/stocks/${path}/forecast?horizon=${nextHorizon}&model=${nextModel}`,
          ),
        ]);
        if (historyRes.ok && forecastRes.ok) {
          const history = (await historyRes.json()) as {
            points: StockAnalysis["chartData"];
          };
          const forecast = (await forecastRes.json()) as {
            chartData?: StockAnalysis["chartData"];
          };
          setChartAnalysis({
            ...analysis,
            chartData: forecast.chartData ?? history.points,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [analysis],
  );

  const onRangeChange = (value: string) => {
    setRange(value);
    void refetch(value, horizon, model);
  };

  const onHorizonChange = (value: string) => {
    setHorizon(value);
    void refetch(range, value, model);
  };

  const onModelChange = (value: string) => {
    setModel(value);
    void refetch(range, horizon, value);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-xl">
              Historical Close Price + 7-Day LSTM Forecast
            </CardTitle>
            <CardDescription className="mt-1">
              Solid line shows historical data. Dashed line shows AI forecast.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ChartControl
              label="Time Range:"
              value={range}
              onChange={onRangeChange}
              options={[
                ["7d", "7 days"],
                ["30d", "30 days"],
                ["90d", "90 days"],
              ]}
            />
            <ChartControl
              label="Forecast:"
              value={horizon}
              onChange={onHorizonChange}
              options={[
                ["3d", "3 days"],
                ["7d", "7 days"],
                ["14d", "14 days"],
              ]}
            />
            <ChartControl
              label="Model:"
              value={model}
              onChange={onModelChange}
              options={[
                ["lstm", "LSTM"],
                ["linear", "Linear Reg"],
                ["ma", "Moving Avg"],
              ]}
              triggerClass="w-32"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <StockForecastChart analysis={chartAnalysis} />
        )}
      </CardContent>
    </Card>
  );
}

function ChartControl({
  label,
  value,
  onChange,
  options,
  triggerClass = "w-28",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  triggerClass?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optValue, text]) => (
            <SelectItem key={optValue} value={optValue}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
