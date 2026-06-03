import { stockChartYAxisDomain } from "@/lib/market/chart-domain";
import type { MarketBar, MarketQuote } from "@/lib/market/types";
import type { PseiDataPoint } from "@/lib/types/stock";

/** Matches dashboard copy: "Last 8 trading days". */
export const PSEI_CHART_TRADING_DAYS = 8;

const MANILA_TZ = "Asia/Manila";

function formatChartDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Calendar trade date in Manila (YYYY-MM-DD) for aligning quotes with bars. */
export function manilaTradeDateFromInstant(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: MANILA_TZ });
}

function formatChartDateFromInstant(instant: Date): string {
  return instant.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: MANILA_TZ,
  });
}

/** Append or update the latest bar from the PSEi index quote when bars lag quotes ingest. */
export function mergePseiQuoteIntoBars(
  bars: MarketBar[],
  quote: MarketQuote | undefined,
): MarketBar[] {
  if (!quote || quote.symbol !== "PSEI") return bars;

  const quoteDay = manilaTradeDateFromInstant(quote.asOf);
  const last = bars.at(-1);

  if (!last) {
    return [
      {
        symbol: "PSEI",
        tradeDate: quoteDay,
        open: quote.lastClose,
        high: quote.lastClose,
        low: quote.lastClose,
        close: quote.lastClose,
        volume: quote.volume,
      },
    ];
  }

  if (last.tradeDate < quoteDay) {
    return [
      ...bars,
      {
        symbol: "PSEI",
        tradeDate: quoteDay,
        open: quote.lastClose,
        high: quote.lastClose,
        low: quote.lastClose,
        close: quote.lastClose,
        volume: quote.volume,
      },
    ];
  }

  if (last.tradeDate === quoteDay) {
    const updated = [...bars];
    updated[updated.length - 1] = {
      ...last,
      close: quote.lastClose,
      high: Math.max(last.high, quote.lastClose),
      low: Math.min(last.low, quote.lastClose),
    };
    return updated;
  }

  return bars;
}

export function barsToPseiChart(bars: MarketBar[]): PseiDataPoint[] {
  const recent = bars.slice(-PSEI_CHART_TRADING_DAYS);
  return recent.map((bar) => ({
    date: formatChartDate(bar.tradeDate),
    value: bar.close,
  }));
}

export function buildPseiChartFromMarket(
  bars: MarketBar[],
  quote?: MarketQuote | null,
): PseiDataPoint[] {
  const merged = mergePseiQuoteIntoBars(bars, quote ?? undefined);
  if (merged.length > 0) return barsToPseiChart(merged);
  if (!quote) return [];
  return [
    {
      date: formatChartDateFromInstant(quote.asOf),
      value: quote.lastClose,
    },
  ];
}

/** Static/demo series: extend with latest PSEi quote when snapshot is newer than last point. */
export function mergePseiQuoteIntoChartPoints(
  points: PseiDataPoint[],
  quote: MarketQuote | undefined,
): PseiDataPoint[] {
  if (!quote || quote.symbol !== "PSEI") return points;

  const label = formatChartDateFromInstant(quote.asOf);
  const next = [...points];
  const last = next.at(-1);

  if (last?.date === label) {
    next[next.length - 1] = { date: label, value: quote.lastClose };
    return next;
  }

  if (next.length >= PSEI_CHART_TRADING_DAYS) next.shift();
  next.push({ date: label, value: quote.lastClose });
  return next;
}

/** Padding so the line is not clipped at min/max. */
export function pseiYAxisDomain(values: number[]): [number, number] {
  return stockChartYAxisDomain(values, { isIndex: true });
}
