"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import type { PortfolioModelMetrics } from "@/lib/forecast/types";

type Skipped = { ticker: string; reason: string };

type BacktestResponse =
  | { available: false; reason: string }
  | {
      available: true;
      horizonDays: number;
      models: PortfolioModelMetrics[];
      bestModel: string | null;
      tickersUsed: string[];
      tickersSkipped: Skipped[];
    };

const metricGlossary: Record<string, string> = {
  MAE: "Mean Absolute Error — average absolute difference between predicted and actual prices, averaged across your watchlist.",
  RMSE: "Root Mean Square Error — penalizes larger forecast errors more than MAE.",
  MAPE: "Mean Absolute Percentage Error — error as a percentage of price, so it's comparable across tickers at different price levels. Used to pick the best-fit model here instead of MAE.",
};

function MetricHead({ label }: { label: keyof typeof metricGlossary }) {
  return (
    <TableHead>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4">
          {label}
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {metricGlossary[label]}
        </TooltipContent>
      </Tooltip>
    </TableHead>
  );
}

const MODEL_LABELS: Record<string, string> = {
  naive: "Naive",
  ma: "Moving Avg",
  linear: "Linear Reg",
};

export function WatchlistPortfolioBacktest() {
  const stocks = useWatchlistStore((s) => s.stocks);
  const tickersKey = stocks.map((s) => s.ticker).join(",");

  const [horizon, setHorizon] = useState("7d");
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const requestKey = `${tickersKey}|${horizon}`;
  const loading = tickersKey !== "" && loadedKey !== requestKey;

  useEffect(() => {
    if (!tickersKey) return;
    let cancelled = false;
    fetch(
      `/api/watchlist/backtest?tickers=${encodeURIComponent(tickersKey)}&horizon=${horizon}`,
    )
      .then((res) => (res.ok ? (res.json() as Promise<BacktestResponse>) : null))
      .then((result) => {
        if (cancelled) return;
        if (result) setData(result);
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [tickersKey, horizon, requestKey]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Portfolio Model Fit</CardTitle>
            <CardDescription className="mt-1">
              Which baseline forecast model best fits your watchlist as a
              whole, backtested per ticker and averaged.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Horizon:</span>
            <Select value={horizon} onValueChange={(v) => v && setHorizon(v)}>
              <SelectTrigger className="w-28" aria-label="Backtest horizon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !data ? (
          <div className="h-40 animate-pulse rounded-lg border bg-muted/30" />
        ) : !data.available ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
            Portfolio backtesting needs published forecast data — none is
            available yet.
          </div>
        ) : data.models.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
            Not enough price history yet for any watchlist ticker.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <MetricHead label="MAE" />
                    <MetricHead label="RMSE" />
                    <MetricHead label="MAPE" />
                    <TableHead>Directional Accuracy</TableHead>
                    <TableHead>Tickers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.models.map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="font-medium">
                        {MODEL_LABELS[m.model] ?? m.model}
                        {m.model === data.bestModel ? (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
                            Best fit
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{m.avgMae.toFixed(2)}</TableCell>
                      <TableCell>{m.avgRmse.toFixed(2)}</TableCell>
                      <TableCell>{m.avgMape.toFixed(1)}%</TableCell>
                      <TableCell>
                        {m.avgDirAccuracy != null
                          ? `${m.avgDirAccuracy.toFixed(1)}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.tickerCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;Best fit&quot; is the model with the lowest average MAPE
              (not MAE) — MAPE stays comparable across tickers at very
              different price levels, where raw peso-denominated MAE
              wouldn&apos;t. Baseline models only (Naive, Moving Average,
              Linear Regression); LSTM isn&apos;t included here.
            </p>
            {data.tickersSkipped.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Skipped:{" "}
                {data.tickersSkipped
                  .map((s) => `${s.ticker} (${s.reason})`)
                  .join(", ")}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
