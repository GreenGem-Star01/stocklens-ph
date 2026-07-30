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
import { Badge } from "@/components/ui/badge";
import { tickerToPath } from "@/lib/forecast";
import type { ModelComparisonRow } from "@/lib/forecast/types";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { StockAnalysis } from "@/lib/types/stock-analysis";
import { cn } from "@/lib/utils";

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

// What the server actually used to build the `analysis` prop passed in
// (buildMarketAnalysis's own defaults — see build-market-analysis.ts).
// Settings can seed the chart's initial range/horizon/model to something
// different, which used to leave the controls showing the user's
// preference while the chart displayed the server's default data — a
// real mismatch, not just a "wrong default". See the mount effect below.
const SERVER_DEFAULT_RANGE = "90d";
const SERVER_DEFAULT_HORIZON = "7d";
const SERVER_DEFAULT_MODEL = "linear";

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
  // Read once at mount — these mirror Settings → Forecast Preferences, but
  // the chart's own controls are the source of truth once a user touches them.
  const [range, setRange] = useState(
    () => useSettingsStore.getState().defaultTimeRange,
  );
  const [horizon, setHorizon] = useState(
    () => useSettingsStore.getState().defaultHorizon,
  );
  const [model, setModel] = useState(
    () => useSettingsStore.getState().preferredModel,
  );
  const [param, setParam] = useState<string | null>(
    () => DEFAULT_PARAM_FOR_MODEL[model] ?? null,
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
        forecastUrl.searchParams.set("range", nextRange);
        forecastUrl.searchParams.set("horizon", nextHorizon);
        forecastUrl.searchParams.set("model", nextModel);
        // Only send param when it's actually non-default — otherwise every
        // ma/linear request would trigger a live "Custom fit" callout even
        // when nothing was customized, which reads as misleading.
        if (nextParam && nextParam !== DEFAULT_PARAM_FOR_MODEL[nextModel]) {
          forecastUrl.searchParams.set("param", nextParam);
        }

        // The forecast endpoint's chartData already reflects `range` (via
        // historyDays) as of this fix — a separate /history fetch used to
        // run alongside this and get silently discarded, since
        // `forecast.chartData ?? history.points` always preferred the
        // (previously range-blind) forecast response.
        const forecastRes = await fetch(forecastUrl);
        if (forecastRes.ok) {
          const forecast = (await forecastRes.json()) as {
            chartData?: StockAnalysis["chartData"];
            performance?: StockAnalysis["performance"];
            modelComparison?: StockAnalysis["modelComparison"];
            customPerformance?: ModelComparisonRow | null;
          };
          setChartAnalysis({
            ...analysis,
            chartData: forecast.chartData ?? analysis.chartData,
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

  // `analysis.chartData` was built server-side using the server's own
  // defaults (range/horizon/model above), not the Settings-derived values
  // this component seeded its controls with — so if a user has customized
  // any of those, the controls show one thing while the chart shows
  // another on first paint. Reconcile once by refetching, the same
  // mechanism a manual control change already uses.
  useEffect(() => {
    if (
      range !== SERVER_DEFAULT_RANGE ||
      horizon !== SERVER_DEFAULT_HORIZON ||
      model !== SERVER_DEFAULT_MODEL
    ) {
      // Deferred to a microtask so refetch's setLoading(true) doesn't run
      // synchronously inside the effect body (same shape as the fetch().then()
      // chains elsewhere in this file — state only updates after a tick).
      void Promise.resolve().then(() => refetch(range, horizon, model, param));
    }
    // Intentionally mount-only: `range`/`horizon`/`model`/`param` here are
    // read for their initial-mount snapshot, not tracked for changes —
    // the on*Change handlers below already refetch when the user changes
    // a control, so depending on them here would double-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <ChartControl
              label="Time Range:"
              ariaLabel="Forecast chart time range"
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
              ariaLabel="Forecast horizon"
              value={horizon}
              onChange={onHorizonChange}
              options={[
                ["7d", "7 days"],
                ["30d", "30 days"],
              ]}
            />
            <ChartControl
              label="Model:"
              ariaLabel="Forecast model"
              value={model}
              onChange={onModelChange}
              options={[
                ["naive", "Naive"],
                ["ma", "Moving Avg"],
                ["linear", "Linear Reg"],
                ["lstm", "LSTM"],
              ]}
              triggerClass="sm:w-32"
            />
            {paramOptions && param ? (
              <ChartControl
                label={model === "ma" ? "Window:" : "Lookback:"}
                ariaLabel={model === "ma" ? "Moving average window" : "Linear regression lookback"}
                value={param}
                onChange={onParamChange}
                options={paramOptions}
                triggerClass="sm:w-32"
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
  ariaLabel,
  value,
  onChange,
  options,
  triggerClass = "sm:w-28",
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  triggerClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className={cn("w-full", triggerClass)} aria-label={ariaLabel}>
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
