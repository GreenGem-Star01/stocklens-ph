import { getStockAnalysisStatic } from "@/lib/data/stocks";
import { generateForecast, forecastTargetFromPoints } from "@/lib/forecast/generate";
import { horizonToDays } from "@/lib/forecast/horizon";
import { bestModelMetrics } from "@/lib/forecast/backtest";
import type { ForecastModel } from "@/lib/forecast/types";
import { weekRangeFromBars } from "@/lib/market/bars-repository";
import { stockChartYAxisDomain } from "@/lib/market/chart-domain";
import {
  formatAsOf,
  formatPriceAmount,
  quoteToDisplay,
} from "@/lib/market/format-quote";
import {
  getForecastFromSnapshot,
  getMetricsFromSnapshot,
} from "@/lib/market/forecasts-snapshot";
import {
  fetchModelMetrics,
  fetchForecastPoints,
  type StoredModelMetrics,
} from "@/lib/market/forecasts-repository";
import type { MarketBar, MarketQuote } from "@/lib/market/types";
import { applyOfficialLabelsToAnalysis } from "@/lib/pse/apply-official-labels";
import { getPseCompanyByTicker } from "@/lib/pse/universe";
import type { ForecastTrend } from "@/lib/types/stock";
import type {
  ChartPoint,
  ModelComparisonRow,
  PerformanceMetrics,
  StockAnalysis,
} from "@/lib/types/stock-analysis";
import { isDbMarketEnabled } from "@/lib/db/config";

const MODEL_LABELS: Record<string, string> = {
  naive: "Naive Baseline",
  ma: "Moving Average",
  linear: "Linear Regression",
  lstm: "LSTM",
};

function formatBarDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function barsToHistoryPoints(bars: MarketBar[]): ChartPoint[] {
  return bars.map((bar) => ({
    date: formatBarDate(bar.tradeDate),
    price: Number(bar.close),
    forecast: null,
  }));
}

function chartValuesFromPoints(points: ChartPoint[]): number[] {
  return points.flatMap((p) => [p.price, p.forecast]).filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
}

function trendFromPrices(last: number, target: number): ForecastTrend {
  const delta = last ? (target - last) / last : 0;
  if (delta > 0.01) return "Projected Upward";
  if (delta < -0.01) return "Projected Downward";
  return "Mixed Signal";
}

function formatTarget(price: number, isIndex: boolean): string {
  if (isIndex) return Math.round(price).toLocaleString("en-PH");
  return formatPriceAmount(price);
}

function metricsToPerformance(m: {
  mae: number;
  rmse: number;
  mape: number;
  dirAccuracy: number | null;
}): PerformanceMetrics {
  return {
    mae: m.mae.toFixed(2),
    rmse: m.rmse.toFixed(2),
    mape: `${m.mape.toFixed(1)}%`,
    directionalAccuracy:
      m.dirAccuracy != null ? `${m.dirAccuracy.toFixed(1)}%` : "N/A",
  };
}

function storedToComparisonRows(metrics: StoredModelMetrics[]): ModelComparisonRow[] {
  if (!metrics.length) return [];
  const bestMae = Math.min(...metrics.map((m) => m.mae));
  return metrics.map((m) => ({
    model: MODEL_LABELS[m.model] ?? m.model.toUpperCase(),
    mae: m.mae.toFixed(2),
    rmse: m.rmse.toFixed(2),
    mape: `${m.mape.toFixed(1)}%`,
    notes: m.mae === bestMae ? "Best MAE" : "",
  }));
}

function catalogTemplate(ticker: string): StockAnalysis {
  const company = getPseCompanyByTicker(ticker);
  const name = company?.companyName ?? ticker.replace(/\.PS$/i, "");
  const sector = company?.sector ?? "Equity";
  const subsector = company?.subsector ?? sector;

  return {
    info: { name, ticker, sector, subsector },
    metrics: {
      lastClose: "—",
      dailyChange: "—",
      dailyChangePositive: true,
      volume: "—",
      weekRange: "—",
    },
    lastUpdated: "—",
    trend: "Mixed Signal",
    forecastTarget: "—",
    chartData: [],
    chartDomain: [0, 1],
    forecastStartDate: "",
    performance: {
      mae: "—",
      rmse: "—",
      mape: "—",
      directionalAccuracy: "—",
    },
    modelComparison: [],
    aiInsight: {
      summary: `${name} is listed on the Philippine Stock Exchange. Forecasts use walk-forward backtests on daily OHLCV when bar history is available.`,
      caution:
        "Insufficient or missing bar history limits indicator and forecast quality.",
      context: `Sector: ${sector}. Run ingest:bars and ingest:forecasts for live metrics.`,
    },
    marketContext: {
      disclosures: ["Check PSE EDGE for company disclosures."],
      pseiIndex: "—",
      pseiChange: "—",
      pseiPositive: true,
      sectorNote: `${sector} sector listing.`,
    },
  };
}

async function loadForecastPoints(
  symbol: string,
  ticker: string,
  model: ForecastModel,
  horizonDays: number,
  bars: MarketBar[],
): Promise<ChartPoint[]> {
  if (isDbMarketEnabled()) {
    const fromDb = await fetchForecastPoints(ticker, model, horizonDays);
    if (fromDb?.length) return fromDb;
  }

  const fromSnap = getForecastFromSnapshot(symbol, model, horizonDays);
  if (fromSnap?.length) return fromSnap;

  if (bars.length >= 60) {
    return generateForecast(bars, model, horizonDays);
  }

  return barsToHistoryPoints(bars);
}

async function loadMetrics(
  symbol: string,
  ticker: string,
  horizonDays: number,
): Promise<StoredModelMetrics[]> {
  if (isDbMarketEnabled()) {
    const fromDb = await fetchModelMetrics(ticker, horizonDays);
    if (fromDb.length) return fromDb;
  }

  return getMetricsFromSnapshot(symbol, horizonDays).map((m) => ({
    model: m.model as ForecastModel,
    horizonDays: m.horizonDays,
    mae: m.mae,
    rmse: m.rmse,
    mape: m.mape,
    dirAccuracy: m.dirAccuracy,
    computedAt: new Date(m.computedAt),
  }));
}

export type BuildMarketAnalysisOptions = {
  model?: ForecastModel;
  horizon?: string;
};

export async function buildMarketAnalysis(
  ticker: string,
  quote: MarketQuote | undefined,
  bars: MarketBar[],
  options: BuildMarketAnalysisOptions = {},
): Promise<StockAnalysis | null> {
  const company = getPseCompanyByTicker(ticker);
  if (!company) return null;

  const normalized = ticker.toUpperCase().includes(".PS")
    ? ticker.toUpperCase()
    : `${ticker.toUpperCase()}.PS`;
  const symbol = normalized.replace(/\.PS$/i, "");
  const model = options.model ?? "linear";
  const horizonDays = options.horizon ? horizonToDays(options.horizon) : 7;

  const base = getStockAnalysisStatic(normalized) ?? catalogTemplate(normalized);
  const isIndex = base.info.sector === "Index" || symbol === "PSEI";

  const chartData = await loadForecastPoints(symbol, normalized, model, horizonDays, bars);
  const forecastStart =
    chartData.find((p) => p.forecast != null)?.date ?? base.forecastStartDate;

  const lastPrice =
    [...chartData].reverse().find((p) => p.price != null)?.price ??
    quote?.lastClose ??
    0;
  const target = forecastTargetFromPoints(chartData);

  let metrics = { ...base.metrics };
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

  const storedMetrics = await loadMetrics(symbol, normalized, horizonDays);
  const best = bestModelMetrics(storedMetrics);
  const performance = best
    ? metricsToPerformance(best)
    : base.performance;
  const modelComparison = storedMetrics.length
    ? storedToComparisonRows(storedMetrics)
  : base.modelComparison;

  const lastUpdated = quote
    ? formatAsOf(quote.asOf)
    : base.lastUpdated;

  return applyOfficialLabelsToAnalysis({
    ...base,
    metrics,
    chartData,
    chartDomain: stockChartYAxisDomain(chartValuesFromPoints(chartData), {
      isIndex,
    }),
    forecastStartDate: forecastStart,
    forecastTarget: formatTarget(target || lastPrice, isIndex),
    trend: trendFromPrices(lastPrice, target || lastPrice),
    performance,
    modelComparison,
    lastUpdated,
  });
}
