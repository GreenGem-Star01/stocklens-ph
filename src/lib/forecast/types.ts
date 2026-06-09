import type { ChartPoint } from "@/lib/types/stock-analysis";

export const BASELINE_MODELS = ["naive", "ma", "linear"] as const;
export type BaselineModel = (typeof BASELINE_MODELS)[number];
export type ForecastModel = BaselineModel | "lstm";

export const FORECAST_HORIZONS = [7, 30] as const;
export type ForecastHorizonDays = (typeof FORECAST_HORIZONS)[number];

export type ModelMetrics = {
  model: ForecastModel;
  horizonDays: number;
  mae: number;
  rmse: number;
  mape: number;
  dirAccuracy: number | null;
};

export type ForecastSeries = {
  model: ForecastModel;
  horizonDays: number;
  points: ChartPoint[];
  generatedAt: Date;
};

export type ModelComparisonRow = {
  model: string;
  mae: string;
  rmse: string;
  mape: string;
  dirAccuracy: string | null;
  best: boolean;
};
