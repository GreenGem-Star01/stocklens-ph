import type { ForecastModel } from "@/lib/forecast/types";

const HORIZON_DAYS: Record<string, number> = {
  "3d": 3,
  "7d": 7,
  "14d": 14,
  "30d": 30,
};

export function horizonToDays(horizon: string): number {
  return HORIZON_DAYS[horizon] ?? 7;
}

export function isForecastModel(value: string): value is ForecastModel {
  return ["naive", "ma", "linear", "lstm"].includes(value);
}
