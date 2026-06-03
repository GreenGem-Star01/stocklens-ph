import { getStockAnalysisStatic } from "@/lib/data/stocks";
import {
  formatChangePct,
  formatPriceAmount,
  formatVolumeAmount,
  quoteToDisplay,
} from "@/lib/market/format-quote";
import { weekRangeFromBars } from "@/lib/market/bars-repository";
import { stockChartYAxisDomain } from "@/lib/market/chart-domain";
import type { MarketBar, MarketQuote } from "@/lib/market/types";
import { applyOfficialLabelsToAnalysis } from "@/lib/pse/apply-official-labels";
import type { ChartPoint, StockAnalysis } from "@/lib/types/stock-analysis";

/** Match demo seed chart length so forecast overlay stays readable. */
const CHART_HISTORY_DAYS = 11;

function formatBarDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatBarDateOffset(isoDate: string, dayOffset: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + dayOffset);
  return formatBarDate(d.toISOString().slice(0, 10));
}

function chartValuesFromPoints(points: ChartPoint[]): number[] {
  return points.flatMap((p) => [p.price, p.forecast]).filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
}

function chartDomainFromPoints(
  points: ChartPoint[],
  isIndex: boolean,
): [number, number] {
  return stockChartYAxisDomain(chartValuesFromPoints(points), { isIndex });
}

function mergeChartData(
  staticAnalysis: StockAnalysis,
  bars: MarketBar[],
): { chartData: ChartPoint[]; forecastStartDate: string } {
  const seedForecast = staticAnalysis.chartData
    .filter((p) => p.forecast != null)
    .map((p) => Number(p.forecast));

  if (bars.length === 0) {
    return {
      chartData: staticAnalysis.chartData,
      forecastStartDate: staticAnalysis.forecastStartDate,
    };
  }

  const recent = bars.slice(-CHART_HISTORY_DAYS);
  const historical: ChartPoint[] = recent.map((bar) => ({
    date: formatBarDate(bar.tradeDate),
    price: Number(bar.close),
    forecast: null,
  }));

  const lastTrade = recent[recent.length - 1]!.tradeDate;
  const forecastPoints: ChartPoint[] = seedForecast.map((forecast, i) => ({
    date: formatBarDateOffset(lastTrade, i + 1),
    price: null,
    forecast,
  }));

  const chartData = [...historical, ...forecastPoints];
  const forecastStartDate =
    forecastPoints[0]?.date ?? staticAnalysis.forecastStartDate;

  return { chartData, forecastStartDate };
}

export function mergeAnalysisWithMarketData(
  ticker: string,
  quote: MarketQuote | undefined,
  bars: MarketBar[],
): StockAnalysis | null {
  const staticAnalysis = getStockAnalysisStatic(ticker);
  if (!staticAnalysis) return null;

  if (!quote && bars.length === 0) {
    return staticAnalysis;
  }

  const isIndex = staticAnalysis.info.sector === "Index";
  const { chartData, forecastStartDate } = mergeChartData(staticAnalysis, bars);

  let metrics = { ...staticAnalysis.metrics };
  if (quote) {
    const display = quoteToDisplay(quote, isIndex);
    metrics = {
      ...metrics,
      lastClose: display.lastClose,
      dailyChange: display.dailyChange,
      dailyChangePositive: display.direction === "up",
      volume: display.volume,
    };
    const week = weekRangeFromBars(bars);
    if (week) {
      metrics.weekRange = isIndex
        ? `${Math.round(week.low).toLocaleString("en-PH")} - ${Math.round(week.high).toLocaleString("en-PH")}`
        : `${formatPriceAmount(week.low)} - ${formatPriceAmount(week.high)}`;
    }
  }

  const lastUpdated = quote
    ? quote.asOf.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      })
    : staticAnalysis.lastUpdated;

  return applyOfficialLabelsToAnalysis({
    ...staticAnalysis,
    metrics,
    chartData,
    chartDomain: chartDomainFromPoints(chartData, isIndex),
    forecastStartDate,
    lastUpdated,
  });
}

export function mergeAnalysisFromMaps(
  ticker: string,
  quotes: Map<string, MarketQuote>,
  barsByTicker: Map<string, MarketBar[]>,
): StockAnalysis | null {
  const symbol = ticker.toUpperCase().replace(/\.PS$/i, "");
  const quote = quotes.get(symbol);
  const bars = barsByTicker.get(symbol) ?? [];
  return mergeAnalysisWithMarketData(ticker, quote, bars);
}

/** Re-export for tests */
export { formatChangePct };
