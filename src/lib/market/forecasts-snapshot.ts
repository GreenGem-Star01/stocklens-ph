import type { ForecastModel } from "@/lib/forecast/types";
import type { ChartPoint } from "@/lib/types/stock-analysis";

type SnapshotForecastRow = {
  symbol: string;
  model: string;
  horizonDays: number;
  generatedAt: string;
  points: ChartPoint[];
};

export type SnapshotMetricsRow = {
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

const STORAGE_PATH = "storage/v1/object/public/market-data/market-forecasts-snapshot.json";

async function fetchSnapshotFromStorage(): Promise<ForecastsSnapshotFile | null> {
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl}/${STORAGE_PATH}`);
    if (!res.ok) return null;

    const data = (await res.json()) as ForecastsSnapshotFile;
    if (!Array.isArray(data.forecasts)) return null;
    return data;
  } catch {
    return null;
  }
}

// Not next/cache's unstable_cache: it throws ("incrementalCache missing")
// outside a real Next.js server request lifecycle, which breaks running
// this in Vitest (see market-provider.test.ts, which exercises this exact
// path). A time-bound module cache gets the same "don't refetch every
// call, but don't cache forever" behavior and works in both runtimes.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSnapshot: ForecastsSnapshotFile | null = null;
let cachedAt = 0;

async function getCachedSnapshot(): Promise<ForecastsSnapshotFile | null> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  const data = await fetchSnapshotFromStorage();
  if (data) {
    cachedSnapshot = data;
    cachedAt = now;
  }
  return data;
}

export async function getForecastFromSnapshot(
  symbol: string,
  model: ForecastModel,
  horizonDays: number,
): Promise<ChartPoint[] | null> {
  const snap = await getCachedSnapshot();
  if (!snap) return null;

  const row = snap.forecasts.find(
    (f) =>
      f.symbol === symbol.toUpperCase() &&
      f.model === model &&
      f.horizonDays === horizonDays,
  );
  return row?.points ?? null;
}

export async function getMetricsFromSnapshot(
  symbol: string,
  horizonDays: number,
): Promise<SnapshotMetricsRow[]> {
  const snap = await getCachedSnapshot();
  if (!snap) return [];

  return snap.metrics.filter(
    (m) => m.symbol === symbol.toUpperCase() && m.horizonDays === horizonDays,
  );
}

export async function getAllForecastsFromSnapshot(): Promise<SnapshotForecastRow[]> {
  const snap = await getCachedSnapshot();
  return snap?.forecasts ?? [];
}

export async function getAllMetricsFromSnapshot(): Promise<SnapshotMetricsRow[]> {
  const snap = await getCachedSnapshot();
  return snap?.metrics ?? [];
}
