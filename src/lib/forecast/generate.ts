import { predictWithModel } from "@/lib/forecast/models";
import type { BaselineModel, ForecastModel } from "@/lib/forecast/types";
import type { MarketBar } from "@/lib/market/types";
import type { ChartPoint } from "@/lib/types/stock-analysis";

const CHART_HISTORY_DAYS = 90;

function formatBarDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function addCalendarDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function generateForecast(
  bars: MarketBar[],
  model: ForecastModel,
  horizonDays: number,
  historyDays = CHART_HISTORY_DAYS,
): ChartPoint[] {
  const sorted = [...bars].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  if (!sorted.length) return [];

  const recent = sorted.slice(-historyDays);
  const closes = recent.map((b) => Number(b.close));
  const lastTrade = recent[recent.length - 1]!.tradeDate;

  const historical: ChartPoint[] = recent.map((bar) => ({
    date: formatBarDate(bar.tradeDate),
    price: Number(bar.close),
    forecast: null,
  }));

  let futurePrices: number[];
  if (model === "lstm") {
    futurePrices = predictWithModel("linear", closes, horizonDays);
  } else {
    futurePrices = predictWithModel(model as BaselineModel, closes, horizonDays);
  }

  const forecastPoints: ChartPoint[] = futurePrices.map((forecast, i) => ({
    date: formatBarDate(addCalendarDays(lastTrade, i + 1)),
    price: null,
    forecast,
  }));

  return [...historical, ...forecastPoints];
}

export function forecastTargetFromPoints(points: ChartPoint[]): number {
  const lastForecast = [...points].reverse().find((p) => p.forecast != null);
  return lastForecast?.forecast ?? 0;
}
