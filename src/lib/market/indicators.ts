import type { MarketBar } from "@/lib/market/types";

export type IndicatorPoint = {
  date: string;
  close: number;
  volume: number | null;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
};

function sma(values: number[], period: number, index: number): number | null {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i++) {
    sum += values[i]!;
  }
  return sum / period;
}

/** Wilder RSI (14-period default). */
function computeRsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i]! - closes[i - 1]!;
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[period] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i]! - closes[i - 1]!;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }

  return out;
}

function emaSeries(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0]!;
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function computeMacd(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const macd: (number | null)[] = new Array(closes.length).fill(null);
  const sig: (number | null)[] = new Array(closes.length).fill(null);
  const hist: (number | null)[] = new Array(closes.length).fill(null);

  if (closes.length < slow) {
    return { macd, signal: sig, hist };
  }

  const emaFast = emaSeries(closes, fast);
  const emaSlow = emaSeries(closes, slow);
  const macdLine: number[] = closes.map((_, i) => emaFast[i]! - emaSlow[i]!);

  const signalLine = emaSeries(macdLine.slice(slow - 1), signal);
  for (let i = slow - 1; i < closes.length; i++) {
    const m = macdLine[i]!;
    const s = signalLine[i - (slow - 1)]!;
    macd[i] = m;
    sig[i] = s;
    hist[i] = m - s;
  }

  return { macd, signal: sig, hist };
}

/** Compute SMA/RSI/MACD from sorted daily bars. */
export function computeIndicators(bars: MarketBar[]): IndicatorPoint[] {
  const sorted = [...bars].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  const closes = sorted.map((b) => Number(b.close));
  const rsi = computeRsi(closes, 14);
  const { macd, signal, hist } = computeMacd(closes);

  return sorted.map((bar, i) => ({
    date: bar.tradeDate,
    close: closes[i]!,
    volume: bar.volume != null ? Number(bar.volume) : null,
    sma20: sma(closes, 20, i),
    sma50: sma(closes, 50, i),
    rsi14: rsi[i] ?? null,
    macd: macd[i] ?? null,
    macdSignal: signal[i] ?? null,
    macdHist: hist[i] ?? null,
  }));
}
