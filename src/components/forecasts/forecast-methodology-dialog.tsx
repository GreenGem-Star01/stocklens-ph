"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";

const MODELS: { name: string; blurb: string }[] = [
  {
    name: "Naive baseline",
    blurb:
      "Repeats the last closing price for every day in the forecast window — the floor every other model is measured against.",
  },
  {
    name: "Moving Average",
    blurb:
      "Extends the recent simple moving average (window is adjustable) flat across the forecast window.",
  },
  {
    name: "Linear Regression",
    blurb:
      "Fits a trend line to a recent lookback window (adjustable) and projects it forward one step at a time.",
  },
  {
    name: "LSTM",
    blurb:
      "A small recurrent sequence model (8 hidden units) fit fresh on each request — not a large pretrained network. It's the same algorithm the offline pipeline uses for the Model Comparison tab's precomputed results, just running in-process here instead of as a separate batch job.",
  },
];

const METRICS: { name: string; blurb: string }[] = [
  {
    name: "MAE",
    blurb:
      "Mean Absolute Error — average absolute difference between predicted and actual price. Lower is better.",
  },
  {
    name: "RMSE",
    blurb:
      "Root Mean Square Error — like MAE, but penalizes larger misses more heavily. Lower is better.",
  },
  {
    name: "MAPE",
    blurb:
      "Mean Absolute Percentage Error — error as a percentage of price, so it's comparable across tickers at very different price levels. Lower is better.",
  },
  {
    name: "Directional accuracy",
    blurb:
      "How often the model got the direction of the move right, regardless of magnitude. Higher is better.",
  },
];

export function ForecastMethodologyDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" />
        }
      >
        <Info className="h-4 w-4" aria-hidden />
        How forecasts work
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How forecasts work</DialogTitle>
          <DialogDescription>
            Four models generate the price forecasts across this app, from a
            simple baseline to a neural network.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {MODELS.map((m) => (
            <div key={m.name}>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.blurb}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Performance metrics</p>
          {METRICS.map((m) => (
            <p key={m.name} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{m.name}:</span>{" "}
              {m.blurb}
            </p>
          ))}
        </div>
        <p className="border-t pt-3 text-xs text-muted-foreground">
          {FORECAST_DISCLAIMER}
        </p>
      </DialogContent>
    </Dialog>
  );
}
