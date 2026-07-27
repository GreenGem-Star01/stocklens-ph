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
import { Badge } from "@/components/ui/badge";
import { tickerToPath } from "@/lib/forecast";
import type { ModelComparisonRow } from "@/lib/forecast/types";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

// Presets, not free numeric input — matches every other forecast control
// here being a Select over a fixed option set. Values mirror
// TUNABLE_PARAM_PRESETS in the forecast API route.
const TUNABLE_PARAM_OPTIONS: Record<string, [string, string][]> = {
  ma: [
    ["10", "Short (10d)"],
    ["20", "Default (20d)"],
    ["50", "Long (50d)"],
  ],
  linear: [
    ["15", "Short (15d)"],
    ["30", "Default (30d)"],
    ["60", "Long (60d)"],
  ],
};
const DEFAULT_PARAM_FOR_MODEL: Record<string, string> = {
  ma: "20",
  linear: "30",
};

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
  const [model, setModel] = useState("linear");
  const [param, setParam] = useState<string | null>(
    DEFAULT_PARAM_FOR_MODEL.linear ?? null,
  );
  const [chartAnalysis, setChartAnalysis] = useState(analysis);
  const [customPerformance, setCustomPerformance] =
    useState<ModelComparisonRow | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(
    async (
      nextRange: string,
      nextHorizon: string,
      nextModel: string,
      nextParam: string | null,
    ) => {
      setLoading(true);
      try {
        const path = tickerToPath(analysis.info.ticker);
        const forecastUrl = new URL(
          `/api/stocks/${path}/forecast`,
          window.location.origin,
        );
        forecastUrl.searchParams.set("horizon", nextHorizon);
        forecastUrl.searchParams.set("model", nextModel);
        // Only send param when it's actually non-default — otherwise every
        // ma/linear request would trigger a live "Custom fit" callout even
        // when nothing was customized, which reads as misleading.
        if (nextParam && nextParam !== DEFAULT_PARAM_FOR_MODEL[nextModel]) {
          forecastUrl.searchParams.set("param", nextParam);
        }

        const [historyRes, forecastRes] = await Promise.all([
          fetch(`/api/stocks/${path}/history?range=${nextRange}`),
          fetch(forecastUrl),
        ]);
        if (historyRes.ok && forecastRes.ok) {
          const history = (await historyRes.json()) as {
            points: StockAnalysis["chartData"];
          };
          const forecast = (await forecastRes.json()) as {
            chartData?: StockAnalysis["chartData"];
            performance?: StockAnalysis["performance"];
            modelComparison?: StockAnalysis["modelComparison"];
            customPerformance?: ModelComparisonRow | null;
          };
          setChartAnalysis({
            ...analysis,
            chartData: forecast.chartData ?? history.points,
            performance: forecast.performance ?? analysis.performance,
            modelComparison:
              forecast.modelComparison ?? analysis.modelComparison,
          });
          setCustomPerformance(forecast.customPerformance ?? null);
        }
      } finally {
        setLoading(false);
      }
    },
    [analysis],
  );

  const onRangeChange = (value: string) => {
    setRange(value);
    void refetch(value, horizon, model, param);
  };

  const onHorizonChange = (value: string) => {
    setHorizon(value);
    void refetch(range, value, model, param);
  };

  const onModelChange = (value: string) => {
    setModel(value);
    const nextParam = DEFAULT_PARAM_FOR_MODEL[value] ?? null;
    setParam(nextParam);
    void refetch(range, horizon, value, nextParam);
  };

  const onParamChange = (value: string) => {
    setParam(value);
    void refetch(range, horizon, model, value);
  };

  const paramOptions = TUNABLE_PARAM_OPTIONS[model];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              Historical Close Price + Baseline Forecast
              <Badge variant="secondary" className="text-xs font-normal">
                Experimental
              </Badge>
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
                ["7d", "7 days"],
                ["30d", "30 days"],
              ]}
            />
            <ChartControl
              label="Model:"
              value={model}
              onChange={onModelChange}
              options={[
                ["naive", "Naive"],
                ["ma", "Moving Avg"],
                ["linear", "Linear Reg"],
                ["lstm", "LSTM"],
              ]}
              triggerClass="w-32"
            />
            {paramOptions && param ? (
              <ChartControl
                label={model === "ma" ? "Window:" : "Lookback:"}
                value={param}
                onChange={onParamChange}
                options={paramOptions}
                triggerClass="w-32"
              />
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[500px]">
          <StockForecastChart analysis={chartAnalysis} />
          {loading ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]"
              aria-busy="true"
              aria-live="polite"
            >
              <div className="pointer-events-none h-full w-full animate-pulse rounded-lg border bg-muted/40 opacity-90" />
            </div>
          ) : null}
        </div>
        {customPerformance ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Custom fit ({model === "ma" ? "window" : "lookback"}={param}):{" "}
            MAE {customPerformance.mae} · RMSE {customPerformance.rmse} · MAPE{" "}
            {customPerformance.mape}
            {customPerformance.dirAccuracy
              ? ` · Directional accuracy ${customPerformance.dirAccuracy}`
              : ""}
            . Not the same as the precomputed comparison table below, which
            always uses default settings.
          </p>
        ) : null}
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
