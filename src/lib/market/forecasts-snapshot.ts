import rawSnapshot from "../../../data/market-forecasts-snapshot.json";
import type { ForecastModel } from "@/lib/forecast/types";
import type { ChartPoint } from "@/lib/types/stock-analysis";

type SnapshotForecastRow = {
  symbol: string;
  model: string;
  horizonDays: number;
  generatedAt: string;
  points: ChartPoint[];
};

type SnapshotMetricsRow = {
  symbol: string;
  model: string;
  horizonDays: number;
  mae: number;
  rmse: number;
  mape: number;
  dirAccuracy: number | null;
  computedAt: string;
};

type ForecastsSnapshotFile = {
  asOf: string;
  forecasts: SnapshotForecastRow[];
  metrics: SnapshotMetricsRow[];
};

let cached: ForecastsSnapshotFile | null | undefined;

function parseSnapshot(): ForecastsSnapshotFile | null {
  if (cached !== undefined) return cached;

  try {
    const data = rawSnapshot as ForecastsSnapshotFile;
    if (!Array.isArray(data.forecasts)) {
      cached = null;
      return null;
    }
    cached = data;
    return data;
  } catch {
    cached = null;
    return null;
  }
}

export function getForecastFromSnapshot(
  symbol: string,
  model: ForecastModel,
  horizonDays: number,
): ChartPoint[] | null {
  const snap = parseSnapshot();
  if (!snap) return null;

  const row = snap.forecasts.find(
    (f) =>
      f.symbol === symbol.toUpperCase() &&
      f.model === model &&
      f.horizonDays === horizonDays,
  );
  return row?.points ?? null;
}

export function getMetricsFromSnapshot(
  symbol: string,
  horizonDays: number,
): SnapshotMetricsRow[] {
  const snap = parseSnapshot();
  if (!snap) return [];

  return snap.metrics.filter(
    (m) => m.symbol === symbol.toUpperCase() && m.horizonDays === horizonDays,
  );
}

export function getAllForecastsFromSnapshot(): SnapshotForecastRow[] {
  return parseSnapshot()?.forecasts ?? [];
}
